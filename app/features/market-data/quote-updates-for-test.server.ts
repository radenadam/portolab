import type { Database } from "~/database/database.server";
import { fail, succeed } from "~/result";
import { fixturePriceSource } from "./fixture-price-source.server";
import { runQuoteUpdate } from "./price-job.server";
import type { PriceJobSettings } from "./price-job-settings";
import type { PriceSource, Quote } from "./price-source.server";
import { trackedInstruments } from "./tracked-instruments";

/** A source that does not answer, so that every update of quotes from it fails. */
export const failingSourceForTest: PriceSource = {
  ...fixturePriceSource,
  fetchQuotes: () => Promise.resolve(fail("Yahoo Finance did not answer.")),
};

/** A source that answers with the quotes of a test and with no quote for any other instrument. */
export function sourceAnsweringForTest(quotes: readonly Quote[]): PriceSource {
  return {
    ...fixturePriceSource,
    fetchQuotes: () =>
      Promise.resolve(succeed({ quotes: [...quotes], problems: [] })),
  };
}

/** The settings of the price job for the tracked instruments and a source of a test. */
export function jobSettingsForTest(
  database: Database,
  priceSource: PriceSource,
): PriceJobSettings {
  return {
    database,
    priceSource,
    instruments: trackedInstruments,
    historyStartDate: "2026-10-26",
  };
}

/** Updates the tracked quotes from a source at a moment, as the price job does, with a signal that never aborts unless the test gives one. */
export function updateQuotesForTest(
  database: Database,
  priceSource: PriceSource,
  options: { at: Date; signal?: AbortSignal },
): Promise<void> {
  return runQuoteUpdate(
    jobSettingsForTest(database, priceSource),
    options.at,
    options.signal ?? new AbortController().signal,
  );
}
