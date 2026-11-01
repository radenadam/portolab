import { expect, test } from "vitest";
import type { DailyClose } from "~/features/market-data/price-source.server";
import { indexPoints } from "~/units/index-points";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { EstimationSettings } from "./estimation-settings";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import {
  alignedReturns,
  periodEndDates,
  returnsBetween,
} from "./period-returns";
import type { ClosePrice } from "./period-returns";

// The closes of the IHSG and BBCA around the ends of September and October 2026, as Yahoo Finance returned them on 1 November 2026, and an invented close on Monday 2 November 2026, a day that has not come yet. The expected returns were computed with the decimal module of Python at 50 significant digits.
function ihsgCloses(
  closes: readonly [string, number][],
): DailyClose<ClosePrice>[] {
  return closes.map(([date, close]) => ({ date, close: indexPoints(close) }));
}

function stockCloses(
  closes: readonly [string, number][],
): DailyClose<ClosePrice>[] {
  return closes.map(([date, close]) => ({
    date,
    close: splitAdjustedRupiah(close),
  }));
}

const marketCloses = ihsgCloses([
  ["2026-09-29", 6121.7],
  ["2026-09-30", 6071.14],
  ["2026-10-01", 6009.5],
  ["2026-10-23", 5439.26],
  ["2026-10-26", 5373.09],
  ["2026-10-30", 5057.05],
  ["2026-11-02", 5100],
]);

test("ends each complete month on its last trading day, and leaves out the month of the latest close", () => {
  expect(periodEndDates(marketCloses, "monthly")).toEqual([
    "2026-09-30",
    "2026-10-30",
  ]);
});

test("ends each complete week on its last trading day, and leaves out the week of the latest close", () => {
  expect(periodEndDates(marketCloses, "weekly")).toEqual([
    "2026-10-01",
    "2026-10-23",
    "2026-10-30",
  ]);
});

test("ends no period for a market with closes in only one period", () => {
  expect(periodEndDates(marketCloses.slice(-1), "monthly")).toEqual([]);
  expect(periodEndDates([], "weekly")).toEqual([]);
});

test("computes each return from the closes on two consecutive period ends", () => {
  expect(returnsBetween(marketCloses, ["2026-09-30", "2026-10-30"])).toEqual([
    {
      formula: "priceChange",
      value: expect.closeTo(-0.16703452728812052, 15) as number,
      inputs: {
        startDate: "2026-09-30",
        startClose: 6071.14,
        endDate: "2026-10-30",
        endClose: 5057.05,
      },
    },
  ]);
});

test("gives no return for the periods on either side of a period end without a close", () => {
  const bbca = stockCloses([
    ["2026-09-30", 6075],
    ["2026-10-30", 4980],
  ]);
  // BBCA has no close on 23 October, so neither the week before nor the week after it has a return.
  expect(
    returnsBetween(bbca, ["2026-09-30", "2026-10-23", "2026-10-30"]),
  ).toEqual([]);
  expect(returnsBetween(bbca, ["2026-08-31", "2026-09-30"])).toEqual([]);
});

const settings: EstimationSettings = {
  frequency: "monthly",
  returnCount: 60,
  minimumReturnCount: 24,
};

test("takes the latest complete periods of the settings, and keeps those in which every instrument has a return", () => {
  const aligned = alignedReturns(
    monthEndClosesForTest("IHSG"),
    [monthEndClosesForTest("BBCA"), monthEndClosesForTest("AMMN")],
    settings,
  );
  if (!aligned.ok) {
    throw new Error("The instruments have enough returns.");
  }
  // October 2026 is the month of the latest close, so the window ends in September. AMMN listed in July 2023, so its first return is that of August 2023.
  expect(aligned.value.windowEnd).toBe("2026-09-30");
  expect(aligned.value.market).toHaveLength(38);
  expect(aligned.value.market[0]?.inputs.startDate).toBe("2023-07-31");
  for (const { returns } of aligned.value.instruments) {
    expect(returns.map((measure) => measure.inputs.endDate)).toEqual(
      aligned.value.market.map((measure) => measure.inputs.endDate),
    );
  }
  expect(
    aligned.value.instruments.map(({ instrument }) => instrument.code),
  ).toEqual(["BBCA", "AMMN"]);
});

test("uses at most the number of returns of the settings", () => {
  const aligned = alignedReturns(
    monthEndClosesForTest("IHSG"),
    [monthEndClosesForTest("BBCA")],
    { ...settings, returnCount: 12, minimumReturnCount: 12 },
  );
  expect(aligned.ok && aligned.value.market).toHaveLength(12);
});

test("fails when fewer periods than the minimum remain, and names the instrument with the fewest returns", () => {
  // AADI listed in December 2024, so the window that ends in September 2026 holds 21 of its returns.
  expect(
    alignedReturns(
      monthEndClosesForTest("IHSG"),
      [
        monthEndClosesForTest("BBCA"),
        monthEndClosesForTest("AADI"),
        monthEndClosesForTest("AMMN"),
      ],
      settings,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "AADI", count: 21, minimum: 24 },
  });
});

test("names the market when no instrument has fewer returns than the market", () => {
  expect(
    alignedReturns(
      { code: "IHSG", closes: marketCloses },
      [{ code: "BBCA", closes: marketCloses }],
      settings,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "IHSG", count: 1, minimum: 24 },
  });
});
