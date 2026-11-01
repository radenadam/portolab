import { setTimeout as wait } from "node:timers/promises";
import { Cron } from "croner";
import { errorDetail } from "~/error-message";
import { writeLog } from "~/write-log.server";
import { missingDataWarnings } from "./missing-data-warnings";
import type { PriceJobSettings } from "./price-job-settings";
import type { Quote } from "./price-source.server";
import { saveQuotes } from "./quote-store.server";
import { runHistoryUpdate } from "./run-history-update.server";
import {
  readLatestUpdateAttempt,
  saveUpdateAttempt,
} from "./update-attempts.server";
import { isUpdateMinute, nextAttemptTime } from "./update-schedule";

// Shorter than the minute between runs of the schedule, so a stalled request ends as a recorded failure before the next run.
const requestTimeoutMilliseconds = 20_000;

// Decision 0001 asks for a low load on Yahoo, and with a second between requests the closes of the whole universe take about a minute.
const historyRequestPauseMilliseconds = 1000;

/** Fetches quotes and daily closes once at startup, so a fresh server shows the last close, then quotes every minute while prices can change and daily closes after each trading day closes. Returns a function that stops the job. */
export function startPriceJob(settings: PriceJobSettings): () => void {
  // The log asks once for each piece of missing data, such as the calendar of a year, instead of every minute.
  const loggedWarnings = new Set<string>();
  const updateQuotes = serializeUpdates(
    () =>
      runQuoteUpdate(
        settings,
        new Date(),
        AbortSignal.timeout(requestTimeoutMilliseconds),
      ),
    "The quote update failed.",
  );
  const updateHistory = serializeUpdates(
    () =>
      runHistoryUpdate(settings, () => new Date(), {
        requestSignal: () => AbortSignal.timeout(requestTimeoutMilliseconds),
        waitBetweenRequests: () => wait(historyRequestPauseMilliseconds),
      }),
    "The history update failed.",
  );
  void updateQuotes();
  void updateHistory();
  const job = new Cron("* * * * *", async () => {
    const now = new Date();
    const { delayMinutes } = settings.priceSource;
    for (const warning of missingDataWarnings(now, delayMinutes)) {
      if (!loggedWarnings.has(warning)) {
        loggedWarnings.add(warning);
        writeLog("warning", warning);
      }
    }
    // The history update decides by itself which closes are due, which costs a few reads of the database when none is, so the schedule asks it every minute.
    void updateHistory();
    if (isUpdateMinute(now, delayMinutes)) {
      await updateQuotes();
    }
  });
  return () => {
    job.stop();
  };
}

/**
 * Returns a function that runs an update. A call while the update runs asks for one more run right after it instead of a second one at the same time. So a run of the schedule that arrives during a long startup run still happens within its minute, as the prices page promises. An error is logged with this message instead of ending the process.
 * @internal Tests call it directly, because calling it through startPriceJob also starts the schedule.
 */
export function serializeUpdates(
  update: () => Promise<void>,
  failureMessage: string,
): () => Promise<void> {
  let isRunning = false;
  // Each call is a request, and the running loop updates again until no request has arrived since its latest update began.
  let requests = 0;
  return async () => {
    requests += 1;
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      let handledRequests = 0;
      while (handledRequests < requests) {
        handledRequests = requests;
        try {
          await update();
        } catch (error) {
          writeLog("error", failureMessage, {
            detail: errorDetail(error),
          });
        }
      }
    } finally {
      isRunning = false;
    }
  };
}

/**
 * Fetches and stores quotes unless the job still waits after failures, and records the attempt with its failures in a row and the instruments that it could not update. A request that outlasts the signal counts as a failure. The state lives in the database, as decision 0009 asks, so a restart keeps waiting.
 * @internal Tests call it directly, because startPriceJob reaches it only with the real clock.
 */
export async function runQuoteUpdate(
  settings: PriceJobSettings,
  now: Date,
  signal: AbortSignal,
): Promise<void> {
  const latestAttempt = readLatestUpdateAttempt(settings.database, "quotes");
  if (latestAttempt !== undefined && now < nextAttemptTime(latestAttempt)) {
    return;
  }
  const savedQuotes = await fetchAndSaveQuotes(settings, now, signal);
  const succeeded = savedQuotes.length > 0;
  const failedCodes: string[] = [];
  for (const instrument of settings.instruments) {
    const isSaved = savedQuotes.some(
      (quote) =>
        quote.kind === instrument.kind && quote.code === instrument.code,
    );
    if (!isSaved) {
      failedCodes.push(instrument.code);
    }
  }
  saveUpdateAttempt(settings.database, "quotes", {
    attemptedAt: now,
    succeeded,
    consecutiveFailures: succeeded
      ? 0
      : (latestAttempt?.consecutiveFailures ?? 0) + 1,
    failedCodes,
  });
}

// Returns the quotes that it stored. An answer without a usable quote is a failure too, so the job backs off and the prices page says so.
async function fetchAndSaveQuotes(
  settings: PriceJobSettings,
  now: Date,
  signal: AbortSignal,
): Promise<readonly Quote[]> {
  try {
    const result = await settings.priceSource.fetchQuotes(
      settings.instruments,
      signal,
    );
    if (!result.ok) {
      writeLog(
        "warning",
        "Prices could not be fetched, so the last prices stay.",
        {
          detail: result.failure,
        },
      );
      return [];
    }
    for (const problem of result.value.problems) {
      writeLog("warning", problem);
    }
    if (result.value.quotes.length === 0) {
      writeLog(
        "warning",
        "The price source answered without a usable quote, so the last prices stay.",
      );
      return [];
    }
    saveQuotes(settings.database, result.value.quotes, now);
    return result.value.quotes;
  } catch (error) {
    writeLog("error", "Fetching or storing prices failed.", {
      detail: errorDetail(error),
    });
    return [];
  }
}
