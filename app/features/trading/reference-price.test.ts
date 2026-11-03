import { expect, test } from "vitest";
import { stockQuote } from "~/features/market-data/stock-quote";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import { stockHistoryForTest } from "~/features/market-data/history-kinds-for-test";
import type { StockHistory } from "~/features/market-data/price-source.server";
import { referencePrice } from "./reference-price";

// An order that trades on Tuesday 3 November 2026, whose trading day before is Monday 2 November 2026. The comment of each quote gives its time in WIB.
const day = { date: "2026-11-03", previousDate: "2026-11-02" };

function bbcaCloses(
  closes: readonly (readonly [string, number])[],
): StockHistory {
  return stockHistoryForTest(
    buildDailyHistory({ kind: "stock", code: "BBCA" }, closes),
  );
}

// The stored closes end with the close of Rp4,980 of Friday 30 October 2026, after the close of Rp4,940 of Thursday.
const closesBeforeMonday = bbcaCloses([["2026-10-30", 4980]]);
// 16:14 on Monday 2 November 2026, the close of Rp5,000.
const quoteOfMonday = stockQuote(
  "BBCA",
  [5_000, 4_980],
  "2026-11-02T09:14:55Z",
);
// 16:14 on Friday 30 October 2026, the latest quote of a stock that did not trade on Monday.
const quoteOfFriday = stockQuote(
  "BBCA",
  [4_980, 4_940],
  "2026-10-30T09:14:55Z",
);
// 09:50 on Tuesday 3 November 2026, after the close of Rp5,000 on Monday.
const quoteOfTuesday = stockQuote(
  "BBCA",
  [4_960, 5_000],
  "2026-11-03T02:50:00Z",
);

test("takes the stored close of the trading day before, rounded to a whole rupiah", () => {
  // A later split can leave a fraction of a rupiah in an adjusted close, and 4,999.6 rounds to Rp5,000.
  expect(
    referencePrice(
      "BBCA",
      {
        quote: quoteOfMonday,
        closes: bbcaCloses([["2026-11-02", 4999.6]]),
      },
      day,
    ),
  ).toEqual({ ok: true, value: 5_000 });
});

test("takes the previous close that a quote of the trading day states before the stored close, because the source adjusts it for a split of that day", () => {
  // A split of one share into two takes effect on Tuesday, so the quote states the close of Rp9,880 of Monday as Rp4,940, and the stored close of Monday is not halved yet.
  expect(
    referencePrice(
      "BBCA",
      {
        quote: stockQuote("BBCA", [4_950, 4_940], "2026-11-03T02:50:00Z"),
        closes: bbcaCloses([["2026-11-02", 9_880]]),
      },
      day,
    ),
  ).toEqual({ ok: true, value: 4_940 });
});

test("takes the previous close that a quote of the trading day states while the history lacks the close", () => {
  expect(
    referencePrice(
      "BBCA",
      { quote: quoteOfTuesday, closes: closesBeforeMonday },
      day,
    ),
  ).toEqual({ ok: true, value: 5_000 });
});

test("fails for a stock that traded on the trading day before until the update of the price history stores its close", () => {
  expect(
    referencePrice(
      "BBCA",
      { quote: quoteOfMonday, closes: closesBeforeMonday },
      day,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "noReferenceClose", code: "BBCA", date: "2026-11-02" },
  });
});

test("fails for a stock that did not trade on the trading day before until it trades again during a session", () => {
  expect(
    referencePrice(
      "BBCA",
      { quote: quoteOfFriday, closes: closesBeforeMonday },
      day,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "noReferenceClose", code: "BBCA", date: "2026-11-02" },
  });
  // 09:50 on Tuesday, when the latest close before the day is still the close of Friday.
  const quoteOfTuesdayAfterNoTrade = stockQuote(
    "BBCA",
    [4_960, 4_980],
    "2026-11-03T02:50:00Z",
  );
  expect(
    referencePrice(
      "BBCA",
      { quote: quoteOfTuesdayAfterNoTrade, closes: closesBeforeMonday },
      day,
    ),
  ).toEqual({ ok: true, value: 4_980 });
});
