import { expect, test } from "vitest";
import { analysisHoldings } from "./analysis-holdings";
import { closeToForTest } from "./close-to-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
  ammnValuationForTest,
  studentLineForTest,
} from "./measures-for-test.server";
import { readPortfolioMeasures, readStockRows } from "./read-measures.server";

test("keeps the portfolio's aligned inputs instead of each stock's own window", () => {
  const database = databaseWithClosesForTest();
  const report = readPortfolioMeasures(database, ammnValuationForTest());
  if (report.kind !== "measured" || !report.measures.ok)
    throw new Error("The AMMN portfolio has measures.");
  expect(report.measures.value.market.returns).toHaveLength(38);
  expect(
    analysisHoldings(report.measures.value, undefined, readStockRows(database)),
  ).toBe(report.measures.value.holdings);
});

test("keeps unpriced holdings on the latest line with their risk and calculation inputs but no weights", () => {
  const database = databaseWithClosesForTest();
  const line = studentLineForTest(database, valuationForTest(["BBCA"]));
  expect(readPortfolioMeasures(database, valuationForTest(["BBCA"]))).toEqual({
    kind: "unpriced",
    codes: ["TLKM"],
  });
  if (!line.ok) throw new Error("The latest IHSG has a line.");
  // Python Decimal computed these standard deviations from the recorded 60 monthly returns.
  expect(
    analysisHoldings(undefined, line.value, readStockRows(database)),
  ).toMatchObject([
    {
      code: "BBCA",
      weight: undefined,
      standardDeviation: closeToForTest(0.05227213243397345, 15),
    },
    {
      code: "TLKM",
      weight: undefined,
      standardDeviation: closeToForTest(0.06884697088938913, 15),
    },
  ]);
  expect(
    analysisHoldings(undefined, undefined, readStockRows(database)),
  ).toEqual([]);
});
