import { expect, test } from "vitest";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import { closeToForTest } from "./close-to-for-test";
import { defaultEstimationSettings } from "./estimation-settings";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import { alignedReturns } from "./aligned-returns";
import type { AlignedReturns, InstrumentCloses } from "./aligned-returns";

// The closes of the IHSG and BBCA around the ends of August, September, and October 2026, as Yahoo Finance returned them on 1 November 2026, and an invented close on Monday 2 November 2026, a day that has not come yet. The expected return was computed with the decimal module of Python at 50 significant digits.
const ihsg = buildDailyHistory({ kind: "index", code: "IHSG" }, [
  ["2026-09-29", 6121.7],
  ["2026-09-30", 6071.14],
  ["2026-10-01", 6009.5],
  ["2026-10-30", 5057.05],
  ["2026-11-02", 5100],
]);

function aligned(
  instruments: readonly InstrumentCloses[],
  settings = defaultEstimationSettings,
): AlignedReturns<InstrumentCloses> {
  const returns = alignedReturns(
    monthEndClosesForTest("IHSG"),
    instruments,
    settings,
  );
  if (!returns.ok) {
    throw new Error(
      `The instruments have enough returns, but the returns failed with ${JSON.stringify(returns.failure)}.`,
    );
  }
  return returns.value;
}

const oneReturn = { returnCount: 1, minimumReturnCount: 1 };

test("computes a return from the closes on the last trading days of two complete months, and leaves out the month of the latest close", () => {
  expect(alignedReturns(ihsg, [], oneReturn)).toEqual({
    ok: true,
    value: {
      market: [
        {
          formula: "priceChange",
          value: closeToForTest(-0.16703452728812052, 15),
          inputs: {
            startDate: "2026-09-30",
            startClose: 6071.14,
            endDate: "2026-10-30",
            endClose: 5057.05,
          },
        },
      ],
      instruments: [],
      windowEnd: "2026-10-30",
    },
  });
});

test("finds no return for a market with closes in only one month", () => {
  expect(
    alignedReturns({ ...ihsg, closes: ihsg.closes.slice(-1) }, [], oneReturn),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "IHSG", count: 0, minimum: 1 },
  });
});

test("gives no return for the months on either side of a month end without a close", () => {
  const market = buildDailyHistory({ kind: "index", code: "IHSG" }, [
    ["2026-08-31", 6525.48],
    ...ihsg.closes.map((close): [string, number] => [close.date, close.close]),
  ]);
  const bbcaWithout = (date: string): InstrumentCloses => ({
    code: "BBCA",
    closes: buildDailyHistory({ kind: "stock", code: "BBCA" }, [
      ["2026-08-31", 6475],
      ["2026-09-30", 6075],
      ["2026-10-30", 4980],
    ]).closes.filter((close) => close.date !== date),
  });
  const twoReturns = { returnCount: 2, minimumReturnCount: 1 };
  // Without the close of 31 August, only October has a return.
  const withoutAugust = alignedReturns(
    market,
    [bbcaWithout("2026-08-31")],
    twoReturns,
  );
  expect(
    withoutAugust.ok &&
      withoutAugust.value.market.map((measure) => measure.inputs.endDate),
  ).toEqual(["2026-10-30"]);
  // Without the close of 30 September, neither September nor October has a return.
  expect(
    alignedReturns(market, [bbcaWithout("2026-09-30")], twoReturns),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "BBCA", count: 0, minimum: 1 },
  });
});

test("takes the latest complete months of the settings, and keeps those in which every instrument has a return", () => {
  const returns = aligned([
    monthEndClosesForTest("BBCA"),
    monthEndClosesForTest("AMMN"),
  ]);
  // October 2026 is the month of the latest close, so the window ends in September. AMMN listed in July 2023, so its first return is that of August 2023.
  expect(returns.windowEnd).toBe("2026-09-30");
  expect(returns.market).toHaveLength(38);
  expect(returns.market[0]?.inputs.startDate).toBe("2023-07-31");
  for (const { returns: instrumentReturns } of returns.instruments) {
    expect(instrumentReturns.map((measure) => measure.inputs.endDate)).toEqual(
      returns.market.map((measure) => measure.inputs.endDate),
    );
  }
  expect(returns.instruments.map(({ instrument }) => instrument.code)).toEqual([
    "BBCA",
    "AMMN",
  ]);
});

test("uses at most the number of returns of the settings", () => {
  const returns = aligned([monthEndClosesForTest("BBCA")], {
    returnCount: 12,
    minimumReturnCount: 12,
  });
  expect(returns.market).toHaveLength(12);
});

test("fails when fewer months than the minimum remain, and names the instrument with the fewest returns", () => {
  // AADI listed in December 2024, so the window that ends in September 2026 holds 21 of its returns.
  expect(
    alignedReturns(
      monthEndClosesForTest("IHSG"),
      [
        monthEndClosesForTest("BBCA"),
        monthEndClosesForTest("AADI"),
        monthEndClosesForTest("AMMN"),
      ],
      defaultEstimationSettings,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "AADI", count: 21, minimum: 24 },
  });
});

test("names the market when no instrument has fewer returns than the market", () => {
  expect(
    alignedReturns(
      ihsg,
      [{ code: "BBCA", closes: ihsg.closes }],
      defaultEstimationSettings,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "IHSG", count: 1, minimum: 24 },
  });
});
