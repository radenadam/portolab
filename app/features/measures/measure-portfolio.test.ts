import { expect, test } from "vitest";
import type { EstimationSettings } from "./estimation-settings";
import { measurePortfolio } from "./measure-portfolio";
import type { Holding, PortfolioMeasures } from "./measure-portfolio";
import { monthEndClosesForTest } from "./month-end-closes-for-test";

// The expected values were computed with the decimal module of Python at 50 significant digits, from the month-end closes in month-end-closes-for-test.ts and a BI-Rate of 5.75%. Python also computed each portfolio variance as the sample variance of the monthly returns of the portfolio, as a student would check it with VAR.S, and got the same value. The window ends on 30 September 2026.
const settings: EstimationSettings = {
  frequency: "monthly",
  returnCount: 60,
  minimumReturnCount: 24,
};
const ihsg = monthEndClosesForTest("IHSG");

function measured(holdings: readonly Holding[]): PortfolioMeasures {
  const measures = measurePortfolio(holdings, ihsg, settings);
  if (!measures.ok) {
    throw new Error(
      `The holdings have enough monthly returns, but the measures failed with ${JSON.stringify(measures.failure)}.`,
    );
  }
  return measures.value;
}

// A matcher for a value that floating point computes to within the last digits of the value of Python.
function closeTo(expected: number, digits: number): number {
  return expect.closeTo(expected, digits) as number;
}

test("measures each holding of a portfolio of two stocks over the latest 60 monthly returns", () => {
  const portfolio = measured([
    { ...monthEndClosesForTest("BBCA"), weight: 0.6 },
    { ...monthEndClosesForTest("TLKM"), weight: 0.4 },
  ]);
  expect(portfolio.market.series.returns).toHaveLength(60);
  expect(
    portfolio.holdings.map((holding) => ({
      code: holding.code,
      weight: holding.weight,
      expectedReturn: holding.series.expectedReturn.value,
      beta: holding.beta.value,
      requiredReturn: holding.requiredReturn.value,
      securityMarketLine: holding.securityMarketLine.value,
    })),
  ).toEqual([
    {
      code: "BBCA",
      weight: 0.6,
      expectedReturn: closeTo(-0.0010226485841997692, 16),
      beta: closeTo(0.6893713956004657, 14),
      requiredReturn: closeTo(0.0018033617934163425, 16),
      securityMarketLine: closeTo(-0.002826010377616112, 16),
    },
    {
      code: "TLKM",
      weight: 0.4,
      expectedReturn: closeTo(-0.005491161260692473, 16),
      beta: closeTo(0.9200241000486532, 14),
      requiredReturn: closeTo(0.0008035225121091798, 16),
      securityMarketLine: closeTo(-0.006294683772801653, 16),
    },
  ]);
  expect(
    portfolio.covarianceMatrix.map((row) => row.map((cell) => cell.value)),
  ).toEqual([
    [closeTo(0.0027323758291948595, 16), closeTo(0.001811061566626053, 16)],
    [closeTo(0.001811061566626053, 16), closeTo(0.004739905400644395, 16)],
  ]);
  expect(
    portfolio.correlationMatrix.map((row) => row.map((cell) => cell.value)),
  ).toEqual([
    [closeTo(1, 14), closeTo(0.5032434833954371, 14)],
    [closeTo(0.5032434833954371, 14), closeTo(1, 14)],
  ]);
});

test("measures a portfolio of two stocks from the measures of its holdings", () => {
  const portfolio = measured([
    { ...monthEndClosesForTest("BBCA"), weight: 0.6 },
    { ...monthEndClosesForTest("TLKM"), weight: 0.4 },
  ]);
  const expectedReturns = portfolio.holdings.map(
    (holding) => holding.series.expectedReturn.value,
  );
  expect(portfolio.expectedReturn).toEqual({
    formula: "weightedSum",
    value: closeTo(-0.0028100536547968507, 16),
    inputs: {
      terms: [
        { code: "BBCA", weight: 0.6, value: expectedReturns[0] },
        { code: "TLKM", weight: 0.4, value: expectedReturns[1] },
      ],
    },
  });
  expect(portfolio.variance).toEqual({
    formula: "portfolioVariance",
    value: closeTo(0.002611349714593758, 16),
    inputs: {
      weights: [0.6, 0.4],
      covariances: portfolio.covarianceMatrix.map((row) =>
        row.map((cell) => cell.value),
      ),
    },
  });
  expect(portfolio.standardDeviation).toEqual({
    formula: "squareRoot",
    value: closeTo(0.051101367052103, 15),
    inputs: { variance: portfolio.variance.value },
  });
  expect(portfolio.beta.formula).toBe("weightedSum");
  expect(portfolio.beta.value).toBeCloseTo(0.7816324773797407, 14);
  expect(portfolio.requiredReturn.value).toBeCloseTo(0.0014034260808934774, 16);
  expect(portfolio.securityMarketLine.value).toBeCloseTo(
    -0.004213479735690328,
    16,
  );
});

test("measures a portfolio with cash and a recent listing over the months that every holding shares", () => {
  // AMMN listed in July 2023, so the holdings share 38 monthly returns. A tenth of the value is cash, which earns nothing.
  const portfolio = measured([
    { ...monthEndClosesForTest("BBCA"), weight: 0.5 },
    { ...monthEndClosesForTest("TLKM"), weight: 0.2 },
    { ...monthEndClosesForTest("AMMN"), weight: 0.2 },
  ]);
  expect(portfolio.market.series.returns).toHaveLength(38);
  expect(
    portfolio.holdings.map((holding) => holding.series.returns.length),
  ).toEqual([38, 38, 38]);
  expect(
    portfolio.holdings.map((holding) => holding.series.expectedReturn.value),
  ).toEqual([
    closeTo(-0.009178727285687405, 16),
    closeTo(-0.00959115117723924, 16),
    closeTo(0.028220485911893658, 16),
  ]);
  expect(
    portfolio.covarianceMatrix.map((row) => row.map((cell) => cell.value)),
  ).toEqual([
    [
      closeTo(0.003040793635819181, 16),
      closeTo(0.0021809996295071386, 16),
      closeTo(0.002031745024244665, 16),
    ],
    [
      closeTo(0.0021809996295071386, 16),
      closeTo(0.00607485889418112, 16),
      closeTo(0.0016466663881488383, 16),
    ],
    [
      closeTo(0.002031745024244665, 16),
      closeTo(0.0016466663881488383, 16),
      closeTo(0.03396535961227728, 15),
    ],
  ]);
  expect(
    portfolio.correlationMatrix.map((row) => row.map((cell) => cell.value)),
  ).toEqual([
    [
      closeTo(1, 14),
      closeTo(0.5074508924645676, 14),
      closeTo(0.19992063495978923, 14),
    ],
    [
      closeTo(0.5074508924645676, 14),
      closeTo(1, 14),
      closeTo(0.1146355753096906, 14),
    ],
    [
      closeTo(0.19992063495978923, 14),
      closeTo(0.1146355753096906, 14),
      closeTo(1, 14),
    ],
  ]);
  expect(portfolio.expectedReturn.value).toBeCloseTo(
    -0.0008634966959128191,
    16,
  );
  expect(portfolio.variance.value).toBeCloseTo(0.003336089391015399, 16);
  expect(portfolio.standardDeviation.value).toBeCloseTo(
    0.05775889014701892,
    15,
  );
  expect(portfolio.beta.value).toBeCloseTo(0.7145932046851381, 14);
  expect(portfolio.requiredReturn.value).toBeCloseTo(-7.03867487764213e-5, 16);
  expect(portfolio.securityMarketLine.value).toBeCloseTo(
    -0.0007931099471363978,
    16,
  );
});

test("measures a portfolio of cash alone at no return, no risk, and the risk-free rate below the security market line", () => {
  const portfolio = measured([]);
  expect(portfolio.holdings).toEqual([]);
  expect(portfolio.covarianceMatrix).toEqual([]);
  expect(portfolio.expectedReturn.value).toBe(0);
  expect(portfolio.variance.value).toBe(0);
  expect(portfolio.standardDeviation.value).toBe(0);
  expect(portfolio.beta.value).toBe(0);
  expect(portfolio.requiredReturn.value).toBeCloseTo(0.004791666666666666, 17);
  expect(portfolio.securityMarketLine.value).toBeCloseTo(
    -0.004791666666666666,
    17,
  );
});

test("fails for a portfolio whose holdings share fewer monthly returns than the minimum, and names the holding with the fewest", () => {
  expect(
    measurePortfolio(
      [
        { ...monthEndClosesForTest("BBCA"), weight: 0.5 },
        { ...monthEndClosesForTest("AADI"), weight: 0.5 },
      ],
      ihsg,
      settings,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "AADI", count: 21, minimum: 24 },
  });
});
