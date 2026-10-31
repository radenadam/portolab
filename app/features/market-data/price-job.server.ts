import { Cron } from "croner";
import type { Database } from "~/database/database.server";
import { errorDetail } from "~/error-message";
import { writeLog } from "~/log.server";
import { isPriceUpdateTime } from "./idx-calendar";
import type { Instrument, PriceSource } from "./price-source.server";
import { saveQuotes, saveUpdateAttempt } from "./quote-store.server";
import { retryDelayMinutes } from "./retry-delay";

export interface PriceJobSettings {
  database: Database;
  priceSource: PriceSource;
  instruments: readonly Instrument[];
}

/** Fetches prices once at startup, so a fresh server shows the last close, then every minute while prices can change. After a failure it waits longer before each new attempt, as decision 0001 asks. Returns a function that stops the job. */
export function startPriceJob(settings: PriceJobSettings): () => void {
  let consecutiveFailures = 0;
  let nextAttemptAt = 0;
  let lastCalendarWarning = "";
  const attempt = async (now: Date): Promise<void> => {
    if (now.getTime() < nextAttemptAt) {
      return;
    }
    const succeeded = await updatePrices(settings, now);
    consecutiveFailures = succeeded ? 0 : consecutiveFailures + 1;
    nextAttemptAt = succeeded
      ? 0
      : now.getTime() + retryDelayMinutes(consecutiveFailures) * 60_000;
  };
  void attempt(new Date());
  const job = new Cron("* * * * *", { protect: true }, async () => {
    const now = new Date();
    const updateTime = isPriceUpdateTime(now);
    // A date that the calendar does not cover still gets prices, and the log asks for the calendar of that year once a day.
    if (!updateTime.ok && updateTime.failure !== lastCalendarWarning) {
      lastCalendarWarning = updateTime.failure;
      writeLog("warning", updateTime.failure);
    }
    if (!updateTime.ok || updateTime.value) {
      await attempt(now);
    }
  });
  return () => {
    job.stop();
  };
}

// An unexpected error is logged instead of thrown, so the job keeps running and tries again later.
async function updatePrices(
  settings: PriceJobSettings,
  now: Date,
): Promise<boolean> {
  let succeeded = false;
  try {
    const result = await settings.priceSource.fetchQuotes(settings.instruments);
    if (result.ok) {
      saveQuotes(settings.database, result.value.quotes, now);
      for (const problem of result.value.problems) {
        writeLog("warning", problem);
      }
      succeeded = true;
    } else {
      writeLog(
        "warning",
        "Prices could not be fetched, so the last prices stay.",
        { detail: result.failure.detail },
      );
    }
  } catch (error) {
    writeLog("error", "The price job failed.", { detail: errorDetail(error) });
  }
  saveUpdateAttempt(settings.database, { attemptedAt: now, succeeded });
  return succeeded;
}
