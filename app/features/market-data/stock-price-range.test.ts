import { expect, test } from "vitest";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { parsePriceChartRange, priceChartStart } from "./price-chart-range";
import { stockPriceRange } from "./stock-price-range";

test("keeps only final stored closes inside 52 weeks, including the boundary, and names the dates of both extremes", () => {
  const closes = [
    ["2025-10-30", 1],
    ["2025-10-31", 10],
    ["2026-02-02", 8.25],
    ["2026-10-30", 12.5],
    ["2026-11-02", 100],
  ].map(([date, close]) => ({
    date: String(date),
    close: splitAdjustedRupiah(Number(close)),
  }));
  expect(
    stockPriceRange({ kind: "stock", code: "TEST", closes }, "2026-10-30"),
  ).toEqual({
    low: closes[2],
    high: closes[3],
    first: "2025-10-31",
    last: "2026-10-30",
    latest: closes[3]?.close,
  });
  expect(
    stockPriceRange({ kind: "stock", code: "TEST", closes: [] }, "2026-10-30"),
  ).toBeUndefined();
});

test("keeps a single stored close as both ends of the available range", () => {
  const point = { date: "2026-10-30", close: splitAdjustedRupiah(1) };
  expect(
    stockPriceRange(
      { kind: "stock", code: "TEST", closes: [point] },
      point.date,
    ),
  ).toEqual({
    low: point,
    high: point,
    first: point.date,
    last: point.date,
    latest: point.close,
  });
});

test("chooses calendar months and clamps a missing day to the end of its month", () => {
  for (const [range, date] of [
    ["1m", "2026-02-28"],
    ["3m", "2025-12-31"],
    ["1y", "2025-03-31"],
    ["5y", "2021-03-31"],
  ] as const) {
    expect(priceChartStart("2026-03-31", range)).toBe(date);
  }
  expect(priceChartStart("2024-02-29", "1y")).toBe("2023-02-28");
});

test("parses every price range and rejects an unknown range with its source and value", () => {
  for (const range of ["1m", "3m", "1y", "5y"]) {
    expect(parsePriceChartRange(range, "range")).toEqual({
      ok: true,
      value: range,
    });
  }
  expect(parsePriceChartRange(null, "range")).toEqual({
    ok: true,
    value: "1y",
  });
  expect(parsePriceChartRange("1d", "range")).toEqual({
    ok: false,
    failure: 'range must be "1m", "3m", "1y", or "5y", but it is "1d".',
  });
});
