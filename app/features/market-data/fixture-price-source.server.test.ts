import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import { fixturePriceSource } from "./fixture-price-source.server";
import { leftOutQuotesForTest } from "./left-out-quotes-for-test";
import { trackedInstruments } from "./tracked-instruments";

test("answers with a quote of every tracked instrument but those that it leaves out, and names each of those as a problem", async () => {
  const answer = successValueForTest(
    await fixturePriceSource.fetchQuotes(
      trackedInstruments,
      new AbortController().signal,
    ),
    "The fixture source always answers",
  );
  const leftOutCodes = leftOutQuotesForTest.map((quote) => quote.code);
  expect(answer.quotes.map((quote) => quote.code)).toEqual(
    trackedInstruments
      .map((instrument) => instrument.code)
      .filter((code) => !leftOutCodes.includes(code)),
  );
  expect(answer.problems).toEqual([
    "The fixture records no quote of UNVR.",
    "The fixture records no quote of WIFI.",
  ]);
});
