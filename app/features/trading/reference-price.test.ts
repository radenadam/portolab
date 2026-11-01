import { expect, test } from "vitest";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import type { Instrument } from "~/features/market-data/price-source.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { quoteForTest } from "./orders-for-test";
import { referencePrice } from "./reference-price";

// An order that trades on Tuesday 3 November 2026, whose trading day before is Monday 2 November 2026. The comment of each quote gives its time in WIB.
const day = { date: "2026-11-03", previousDate: "2026-11-02" };

const bbca: Instrument = { kind: "stock", code: "BBCA" };

const marketWithMonday = buildDailyHistory(marketIndex, [
  ["2026-10-30", 5057.05],
  ["2026-11-02", 5100],
]);
const marketBeforeMonday = buildDailyHistory(marketIndex, [
  ["2026-10-30", 5057.05],
]);
const stockBeforeMonday = buildDailyHistory(bbca, [["2026-10-30", 4980]]);
// 16:14 on Friday 30 October 2026.
const quoteOfFriday = quoteForTest("BBCA", 4_980, "2026-10-30T09:14:55Z");
// 16:14 on Monday 2 November 2026.
const quoteOfMonday = quoteForTest("BBCA", 5_000, "2026-11-02T09:14:55Z");

test("takes the stored close of the trading day before, rounded to a whole rupiah", () => {
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfMonday,
        closes: buildDailyHistory(bbca, [["2026-11-02", 4999.6]]),
        marketCloses: marketWithMonday,
      },
      day,
    ),
  ).toEqual({ ok: true, value: 5_000 });
});

test("takes the previous close that a quote of the trading day states while the history lacks the close", () => {
  // 09:50 on Tuesday 3 November 2026, with a previous close of Rp4,940.
  const quoteOfTuesday = quoteForTest("BBCA", 4_960, "2026-11-03T02:50:00Z");
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfTuesday,
        closes: stockBeforeMonday,
        marketCloses: marketBeforeMonday,
      },
      day,
    ),
  ).toEqual({ ok: true, value: 4_940 });
});

test("takes the latest stored close of a stock that did not trade on the trading day before, such as a suspended one", () => {
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfFriday,
        closes: stockBeforeMonday,
        marketCloses: marketWithMonday,
      },
      day,
    ),
  ).toEqual({ ok: true, value: 4_980 });
});

test("fails while the update of the price history has not reached the trading day before", () => {
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfFriday,
        closes: stockBeforeMonday,
        marketCloses: marketBeforeMonday,
      },
      day,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "noReferenceClose", code: "BBCA", date: "2026-11-02" },
  });
});

test("fails for a stock that traded on the trading day before while its close is not stored yet", () => {
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfMonday,
        closes: stockBeforeMonday,
        marketCloses: marketWithMonday,
      },
      day,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "noReferenceClose", code: "BBCA", date: "2026-11-02" },
  });
});

test("fails for a stock whose stored closes end before its latest quote", () => {
  // The quote of Friday is newer than the latest stored close of Thursday 29 October 2026.
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfFriday,
        closes: buildDailyHistory(bbca, [["2026-10-29", 4940]]),
        marketCloses: marketWithMonday,
      },
      day,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "noReferenceClose", code: "BBCA", date: "2026-11-02" },
  });
});
