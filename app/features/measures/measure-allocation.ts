import { matrixCell } from "~/matrix-cell";
import { weightedCovariance } from "./weighted-covariance";
import { fail, succeed } from "~/result";

import { beta as toBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { monthlyVariance } from "~/units/monthly-variance";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { varianceShare } from "~/units/variance-share";

import {
  measureRequiredReturn,
  measureSecurityMarketLineDistance,
} from "./capm";

import { measureSharpeRatio, measureTreynorRatio } from "./performance-ratios";

import {
  measureCorrelation,
  measureStandardDeviation,
} from "./return-statistics";
import type { StandardDeviationMeasure } from "./return-statistics";

import type {
  WeightedSumMeasure,
  PortfolioVarianceMeasure,
  HoldingRisk,
  NoPortfolioVariation,
} from "./measure-portfolio";

/** Reuses the shared-month estimates when weights change, without estimating new returns or changing the observed correlations. */
export function measureAllocation(
  holdings: readonly {
    code: string;
    weight: PortfolioWeight;
    expectedReturn: { value: MonthlyReturn };
    standardDeviation: { value: MonthlyReturn };
    beta: { value: Beta };
  }[],
  covarianceMatrix: readonly (readonly { value: MonthlyVariance }[])[],
  market: {
    riskFreeRate: { value: MonthlyReturn };
    expectedReturn: { value: MonthlyReturn };
  },
) {
  const holdingMeasures = holdings.map((holding, rowIndex) => ({
    ...holding,
    covarianceWithPortfolio: measureWeightedSum(
      holdings.map((column, columnIndex) => ({
        code: column.code,
        weight: column.weight,
        value: matrixCell(covarianceMatrix, rowIndex, columnIndex).value,
      })),
      monthlyVariance,
    ),
  }));
  const variance = measurePortfolioVariance(holdingMeasures, covarianceMatrix);
  const standardDeviation = measureStandardDeviation(variance.value);
  const expectedReturn = measureWeightedSum(
    holdingMeasures.map((holding) => ({
      code: holding.code,
      weight: holding.weight,
      value: holding.expectedReturn.value,
    })),
    monthlyReturn,
  );
  const beta = measureWeightedSum(
    holdingMeasures.map((holding) => ({
      code: holding.code,
      weight: holding.weight,
      value: holding.beta.value,
    })),
    toBeta,
  );
  const requiredReturn = measureRequiredReturn(beta.value, market);
  const excessReturn = {
    expectedReturn: expectedReturn.value,
    riskFreeRate: market.riskFreeRate.value,
  };
  const noVariation: NoPortfolioVariation = { kind: "noPortfolioVariation" };
  const hasVariation = variance.value > 0;
  return {
    covariancesWithPortfolio: holdingMeasures.map(
      (holding) => holding.covarianceWithPortfolio,
    ),
    expectedReturn,
    variance,
    standardDeviation,
    beta,
    requiredReturn,
    securityMarketLine: measureSecurityMarketLineDistance(
      expectedReturn.value,
      requiredReturn,
    ),
    sharpeRatio: hasVariation
      ? succeed(measureSharpeRatio(excessReturn, standardDeviation.value))
      : fail(noVariation),
    treynorRatio: measureTreynorRatio(excessReturn, beta.value),
    holdingRisks: hasVariation
      ? succeed(
          holdingMeasures.map((holding) =>
            measureHoldingRisk(holding, { variance, standardDeviation }),
          ),
        )
      : fail(noVariation),
  };
}

function measureWeightedSum<Value extends number>(
  terms: readonly { code: string; weight: PortfolioWeight; value: Value }[],
  toValue: (sum: number) => Value,
): WeightedSumMeasure<Value> {
  let sum = 0;
  for (const term of terms) {
    sum += term.weight * term.value;
  }
  return { formula: "weightedSum", value: toValue(sum), inputs: { terms } };
}

function measurePortfolioVariance(
  holdings: readonly { weight: PortfolioWeight }[],
  covarianceMatrix: readonly (readonly { value: MonthlyVariance }[])[],
): PortfolioVarianceMeasure {
  const weights = holdings.map((holding) => holding.weight);
  let variance = 0;
  for (const [rowIndex, rowWeight] of weights.entries()) {
    for (const [columnIndex, columnWeight] of weights.entries()) {
      variance += weightedCovariance(
        rowWeight,
        columnWeight,
        matrixCell(covarianceMatrix, rowIndex, columnIndex).value,
      );
    }
  }
  return {
    formula: "portfolioVariance",
    value: monthlyVariance(variance),
    inputs: {
      weights,
      covariances: covarianceMatrix.map((row) => row.map((cell) => cell.value)),
    },
  };
}

/** Measures the share of the variance of a portfolio that a holding adds, and the correlation of the holding with the portfolio, which both divide by the risk of a portfolio whose variance is above zero. */
function measureHoldingRisk(
  holding: {
    code: string;
    weight: PortfolioWeight;
    standardDeviation: { value: MonthlyReturn };
    covarianceWithPortfolio: WeightedSumMeasure<MonthlyVariance>;
  },
  portfolio: {
    variance: PortfolioVarianceMeasure;
    standardDeviation: StandardDeviationMeasure;
  },
): HoldingRisk {
  const covarianceWithPortfolio = holding.covarianceWithPortfolio.value;
  return {
    code: holding.code,
    varianceShare: {
      formula: "varianceShare",
      value: varianceShare(
        (holding.weight * covarianceWithPortfolio) / portfolio.variance.value,
      ),
      inputs: {
        weight: holding.weight,
        covarianceWithPortfolio,
        portfolioVariance: portfolio.variance.value,
      },
    },
    correlationWithPortfolio: measureCorrelation({
      covariance: covarianceWithPortfolio,
      firstStandardDeviation: holding.standardDeviation.value,
      secondStandardDeviation: portfolio.standardDeviation.value,
    }),
  };
}
