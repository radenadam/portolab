import { Cron } from "croner";
import { database } from "~/database/database.server";
import { errorDetail } from "~/error-message";
import { writeLog } from "~/log.server";
import { isPriceUpdateTime } from "./idx-calendar";
import type { Instrument, PriceSource } from "./price-source.server";
import { saveQuotes } from "./quote-store.server";

/** Fetches prices once at startup, so a fresh server shows the last close, then every minute while prices can change. Returns a function that stops the job. */
export function startPriceJob(
  priceSource: PriceSource,
  instruments: readonly Instrument[],
): () => void {
  void updatePrices(priceSource, instruments);
  const job = new Cron("* * * * *", { protect: true }, async () => {
    if (isPriceUpdateTime(new Date())) {
      await updatePrices(priceSource, instruments);
    }
  });
  return () => {
    job.stop();
  };
}

// An unexpected error is logged instead of thrown, so the job keeps running and tries again the next minute.
async function updatePrices(
  priceSource: PriceSource,
  instruments: readonly Instrument[],
): Promise<void> {
  try {
    const result = await priceSource.fetchQuotes(instruments);
    if (!result.ok) {
      writeLog(
        "warning",
        "Prices could not be fetched, so the last prices stay.",
        {
          detail: result.failure.detail,
        },
      );
      return;
    }
    saveQuotes(database(), result.value.quotes, new Date());
    for (const problem of result.value.problems) {
      writeLog("warning", problem);
    }
  } catch (error) {
    writeLog("error", "The price job failed.", {
      detail: errorDetail(error),
    });
  }
}
