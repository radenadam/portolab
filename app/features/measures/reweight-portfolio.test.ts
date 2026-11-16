import { expect, test } from "vitest";
import { portfolioWeight } from "~/units/portfolio-weight";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { readPortfolioMeasures } from "./read-measures.server";
import { reweightPortfolio } from "./reweight-portfolio";

test("reweights shared-month estimates against independent Python Decimal calculations", () => {
  const report = readPortfolioMeasures(
    databaseWithClosesForTest(),
    valuationForTest(["BBCA", "TLKM"]),
  );
  if (report.kind !== "measured" || !report.measures.ok)
    throw new Error("The recorded portfolio has measures.");
  const portfolio = report.measures.value;
  const original = reweightPortfolio(portfolio, new Map());
  expect(original.expectedReturn.value).toBe(portfolio.expectedReturn);
  expect(original.variance.value).toBe(portfolio.variance);
  expect(original.beta.value).toBe(portfolio.beta);
  const changed = reweightPortfolio(
    portfolio,
    new Map([
      ["BBCA", portfolioWeight(0.2)],
      ["TLKM", portfolioWeight(0.4)],
    ]),
  );
  // Python Decimal at 50 digits used the estimates recorded in measure-portfolio.test.ts, with weights 0.2 and 0.4 and cash 0.4.
  expect(changed.expectedReturn.value).toBeCloseTo(-0.002400994221116943, 16);
  expect(changed.variance.value).toBeCloseTo(0.001157449747931066, 16);
  expect(changed.standardDeviation.value).toBeCloseTo(0.03402131314236807, 15);
  expect(changed.beta.value).toBeCloseTo(0.5058839191395544, 14);
  expect(changed.requiredReturn.value).toBeCloseTo(0.002598748030193607, 16);
  expect(changed.securityMarketLine.value).toBeCloseTo(
    -0.00499974225131055,
    16,
  );
  expect(changed.sharpeRatio.ok && changed.sharpeRatio.value.value).toBeCloseTo(
    -0.21141632181229092,
    14,
  );
  expect(
    changed.treynorRatio.ok && changed.treynorRatio.value.value,
  ).toBeCloseTo(-0.014218006573558279, 16);
  expect(changed.cash).toBeCloseTo(0.4, 15);
  expect(changed.variance.inputs.covariances).toEqual(
    original.variance.inputs.covariances,
  );
  const cash = reweightPortfolio(
    portfolio,
    new Map(
      portfolio.holdings.map((holding) => [holding.code, portfolioWeight(0)]),
    ),
  );
  expect(cash.expectedReturn.value).toBe(0);
  expect(cash.variance.value).toBe(0);
  expect(cash.beta.value).toBe(0);
  expect(cash.cash).toBe(1);
  expect(cash.sharpeRatio).toEqual({
    ok: false,
    failure: { kind: "noPortfolioVariation" },
  });
  expect(cash.treynorRatio).toEqual({
    ok: false,
    failure: { kind: "betaNotPositive", beta: 0 },
  });
});
