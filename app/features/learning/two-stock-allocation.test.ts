import { expect, test } from "vitest";
import { lessonPracticeForTest } from "./lesson-practice-for-test";
import { twoStockAllocation } from "./two-stock-allocation";
import { correlation } from "~/units/correlation";
import { portfolioWeight } from "~/units/portfolio-weight";

test("isolates weights and correlation against independent Python Decimal calculations", () => {
  const portfolio = lessonPracticeForTest().simulation;
  if (portfolio === undefined)
    throw new Error("The fixture has shared-month measures.");
  // Python Decimal at 50 digits used the recorded BBCA and TLKM estimates in measure-portfolio.test.ts, at equal weights and the slider's correlation endpoints and midpoint.
  for (const [rho, risk] of [
    [-1, 0.008287419227708],
    [0, 0.043221178922605],
    [1, 0.060559551661681],
  ] as const) {
    const measured = twoStockAllocation(portfolio, {
      first: "BBCA",
      second: "TLKM",
      weight: portfolioWeight(0.5),
      correlation: correlation(rho),
    });
    expect(measured.risks.first).toBeCloseTo(0.052272132433973, 15);
    expect(measured.risks.second).toBeCloseTo(0.068846970889389, 15);
    expect(measured.standardDeviation.value).toBeCloseTo(risk, 14);
    expect(measured.averageRisk).toBeCloseTo(0.060559551661681, 14);
    expect(measured.expectedReturn.value).toBeCloseTo(-0.003256904922446, 15);
  }
  for (const [weight, risk, expected] of [
    [0, 0.068846970889389, -0.005491161260692],
    [1, 0.052272132433973, -0.0010226485842],
  ] as const) {
    const measured = twoStockAllocation(portfolio, {
      first: "BBCA",
      second: "TLKM",
      weight: portfolioWeight(weight),
      correlation: correlation(-1),
    });
    expect(measured.standardDeviation.value).toBeCloseTo(risk, 14);
    expect(measured.expectedReturn.value).toBeCloseTo(expected, 15);
  }
  const first = portfolio.holdings.find((holding) => holding.code === "BBCA");
  const second = portfolio.holdings.find((holding) => holding.code === "TLKM");
  if (first === undefined || second === undefined)
    throw new Error("The fixture holds both recorded stocks.");
  const weight = portfolioWeight(
    second.standardDeviation /
      (first.standardDeviation + second.standardDeviation),
  );
  expect(weight * first.standardDeviation).toBeCloseTo(
    (1 - weight) * second.standardDeviation,
    15,
  );
  // By hand, perfectly opposed weighted risks of the same size cancel. The square root must not receive a negative rounding residue.
  const cancelled = twoStockAllocation(portfolio, {
    first: first.code,
    second: second.code,
    weight,
    correlation: correlation(-1),
  });
  expect(cancelled.standardDeviation.value).toBeCloseTo(0, 8);
  expect(Number.isFinite(cancelled.standardDeviation.value)).toBe(true);
});
