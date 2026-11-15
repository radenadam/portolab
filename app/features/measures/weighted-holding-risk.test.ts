import { expect, test } from "vitest";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { readPortfolioMeasures } from "./read-measures.server";
import { weightedHoldingRisk } from "./weighted-holding-risk";

test("weighs the risk of aligned holdings with cash adding zero", () => {
  const report = readPortfolioMeasures(
    databaseWithClosesForTest(),
    valuationForTest(["BBCA", "TLKM"]),
  );
  if (report.kind !== "measured" || !report.measures.ok)
    throw new Error("The fixture portfolio has measures.");
  const portfolio = report.measures.value;
  expect(portfolio.cash.weight).toBe(0.2);
  // Python Decimal at 50 digits gives risks of 0.052272132433973455 and 0.068846970889389134 from the recorded 60 monthly returns. Their weights of 0.5 and 0.3 give 0.046790157483803468.
  expect(weightedHoldingRisk(portfolio)).toBeCloseTo(0.046790157483803468, 16);
  expect(weightedHoldingRisk(portfolio)).toBeGreaterThan(
    portfolio.standardDeviation,
  );
});
