import { Cron } from "croner";
import type { Database } from "~/database/database.server";
import { errorDetail } from "~/error-message";
import { writeLog } from "~/write-log.server";
import { isPriceUpdateTime } from "./idx-calendar";
import type { Instrument, PriceSource, Quote } from "./price-source.server";
import {
  readLatestUpdateAttempt,
  saveQuotes,
  saveUpdateAttempt,
} from "./quote-store.server";
import { isUpdateMinute, nextAttemptTime } from "./update-schedule";

// Shorter than the minute between runs of the schedule, so a stalled request ends as a recorded failure before the next run.
const requestTimeoutMilliseconds = 20_000;

export interface PriceJobSettings {
  database: Database;
  priceSource: PriceSource;
  instruments: readonly Instrument[];
}

/** Fetches prices once at startup, so a fresh server shows the last close, then every minute while prices can change. Returns a function that stops the job. */
export function startPriceJob(settings: PriceJobSettings): () => void {
  let lastCalendarWarning = "";
  const updatePrices = createPriceUpdater(settings);
  void updatePrices();
  const job = new Cron("* * * * *", async () => {
    const now = new Date();
    const updateTime = isPriceUpdateTime(now);
    // The log asks once for the calendar of a year that no calendar covers.
    if (!updateTime.ok && updateTime.failure !== lastCalendarWarning) {
      lastCalendarWarning = updateTime.failure;
      writeLog("warning", updateTime.failure);
    }
    if (isUpdateMinute(now)) {
      await updatePrices();
    }
  });
  return () => {
    job.stop();
  };
}

/**
 * Returns a function that updates prices. A call while an update runs asks for one more update right after it instead of a second one at the same time. So a run of the schedule that arrives during a long startup run still happens within its minute, as the prices page promises. An error is logged instead of ending the process.
 * @internal Tests call it directly, because startPriceJob reaches it only through a running schedule.
 */
export function createPriceUpdater(
  settings: PriceJobSettings,
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
          await runPriceUpdate(
            settings,
            new Date(),
            AbortSignal.timeout(requestTimeoutMilliseconds),
          );
        } catch (error) {
          writeLog("error", "The price job failed.", {
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
 * Fetches and stores prices unless the job still waits after failures, and records the attempt with its failures in a row and the instruments that it could not update. A request that outlasts the signal counts as a failure. The state lives in the database, as decision 0009 asks, so a restart keeps waiting.
 * @internal Tests call it directly, because startPriceJob reaches it only with the real clock.
 */
export async function runPriceUpdate(
  settings: PriceJobSettings,
  now: Date,
  signal: AbortSignal,
): Promise<void> {
  const latestAttempt = readLatestUpdateAttempt(settings.database);
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
  saveUpdateAttempt(settings.database, {
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
