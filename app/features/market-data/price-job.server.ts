import { Cron } from "croner";
import type { Database } from "~/database/database.server";
import { errorDetail } from "~/error-message";
import { writeLog } from "~/log.server";
import { isPriceUpdateTime } from "./idx-calendar";
import type { Instrument, PriceSource } from "./price-source.server";
import {
  readLatestUpdateAttempt,
  saveQuotes,
  saveUpdateAttempt,
} from "./quote-store.server";
import { nextAttemptTime } from "./retry-delay";

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
    const updateTime = isPriceUpdateTime(new Date());
    // A date that the calendar does not cover still gets prices, and the log asks for the calendar of that year once.
    if (!updateTime.ok && updateTime.failure !== lastCalendarWarning) {
      lastCalendarWarning = updateTime.failure;
      writeLog("warning", updateTime.failure);
    }
    if (!updateTime.ok || updateTime.value) {
      await updatePrices();
    }
  });
  return () => {
    job.stop();
  };
}

/** Returns a function that updates prices once. A call while an update still runs does nothing, so the startup run and a run of the schedule never fetch at the same time, and an error is logged instead of ending the process. */
export function createPriceUpdater(
  settings: PriceJobSettings,
): () => Promise<void> {
  let isRunning = false;
  return async () => {
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      await runPriceUpdate(settings, new Date());
    } catch (error) {
      writeLog("error", "The price job failed.", {
        detail: errorDetail(error),
      });
    } finally {
      isRunning = false;
    }
  };
}

/** Fetches and stores prices unless the job still waits after failures, and records the attempt with its failures in a row. The state lives in the database, as decision 0009 asks, so a restart keeps waiting. */
export async function runPriceUpdate(
  settings: PriceJobSettings,
  now: Date,
): Promise<void> {
  const latestAttempt = readLatestUpdateAttempt(settings.database);
  if (latestAttempt !== undefined && now < nextAttemptTime(latestAttempt)) {
    return;
  }
  const succeeded = await fetchAndSaveQuotes(settings, now);
  saveUpdateAttempt(settings.database, {
    attemptedAt: now,
    succeeded,
    consecutiveFailures: succeeded
      ? 0
      : (latestAttempt?.consecutiveFailures ?? 0) + 1,
  });
}

// An answer without a usable quote is a failure too, so the job backs off and the prices page says so.
async function fetchAndSaveQuotes(
  settings: PriceJobSettings,
  now: Date,
): Promise<boolean> {
  try {
    const result = await settings.priceSource.fetchQuotes(settings.instruments);
    if (!result.ok) {
      writeLog(
        "warning",
        "Prices could not be fetched, so the last prices stay.",
        {
          detail: result.failure,
        },
      );
      return false;
    }
    for (const problem of result.value.problems) {
      writeLog("warning", problem);
    }
    if (result.value.quotes.length === 0) {
      writeLog(
        "warning",
        "The price source answered without a usable quote, so the last prices stay.",
      );
      return false;
    }
    saveQuotes(settings.database, result.value.quotes, now);
    return true;
  } catch (error) {
    writeLog("error", "Fetching or storing prices failed.", {
      detail: errorDetail(error),
    });
    return false;
  }
}
