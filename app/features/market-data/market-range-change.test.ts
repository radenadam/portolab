import { expect, expectTypeOf, test } from "vitest";
import {
  marketRangeChange,
  marketPortfolioChange,
} from "./market-range-change";
import { priceChartStart } from "./price-chart-range";
import { cumulativeReturn } from "~/units/cumulative-return";
import { portfolioWeight } from "~/units/portfolio-weight";
import { indexPoints } from "~/units/index-points";
import type { IndexPoints } from "~/units/index-points";

test("requires a quote in the same unit as its closes", () => {
  expectTypeOf(marketRangeChange<IndexPoints>)
    .parameter(2)
    .toEqualTypeOf<{ value: IndexPoints; quotedAt: Date } | undefined>();
});

// Decimal division and SUMPRODUCT give 0.25, 0.5, 1, and a weighted change of 0.075 for these synthetic index levels and weights.
test("compares the current quote with the last final close on or before each calendar range", () => {
  const closes = [
    { date: "2025-11-14", close: indexPoints(60) },
    { date: "2026-08-14", close: indexPoints(80) },
    { date: "2026-10-14", close: indexPoints(96) },
    { date: "2026-11-13", close: indexPoints(110) },
  ];
  const quote = {
    value: indexPoints(120),
    quotedAt: new Date("2026-11-16T03:00:00Z"),
  };
  for (const [range, expected] of [
    ["1m", 0.25],
    ["3m", 0.5],
    ["1y", 1],
  ] as const)
    expect(
      marketRangeChange(closes, priceChartStart("2026-11-16", range), quote),
    ).toBe(expected);
  expect(marketRangeChange(closes, "2026-10-18", quote)).toBe(0.25);
  expect(marketRangeChange(closes, "2025-11-13", quote)).toBeUndefined();
  expect(marketRangeChange(closes, "2026-10-14", undefined)).toBeUndefined();
  expect(
    marketRangeChange(closes, "2026-10-14", {
      ...quote,
      quotedAt: new Date("2026-10-14T03:00:00Z"),
    }),
  ).toBeUndefined();
});

test("keeps cash at zero change and refuses a portfolio whose holding lacks a comparison", () => {
  const holdings = [
    { weight: portfolioWeight(0.4), change: cumulativeReturn(0.25) },
    { weight: portfolioWeight(0.25), change: cumulativeReturn(-0.1) },
  ];
  expect(marketPortfolioChange(holdings)).toBeCloseTo(0.075, 12);
  expect(
    marketPortfolioChange([
      ...holdings,
      { weight: portfolioWeight(0.1), change: undefined },
    ]),
  ).toBeUndefined();
});
