import type { Database } from "~/database/database.server";
import { fail, succeed } from "~/result";
import { fixturePriceSource } from "./fixture-price-source.server";
import { leftOutQuotesForTest } from "./left-out-quotes-for-test";
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

/** A source that answers as the fixture source does, and also with the quotes that the fixture source leaves out, so that it answers for every instrument that Portolab tracks. */
export const completeSourceForTest: PriceSource = {
  ...fixturePriceSource,
  fetchQuotes: async (instruments, signal) => {
    const answer = await fixturePriceSource.fetchQuotes(instruments, signal);
    if (!answer.ok) {
      return answer;
    }
    const leftOut = leftOutQuotesForTest.filter((quote) =>
      instruments.some((instrument) => instrument.code === quote.code),
    );
    return succeed({
      quotes: [...answer.value.quotes, ...leftOut],
      problems: [],
    });
  },
};

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
