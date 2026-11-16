import { matrixCell } from "~/matrix-cell";
import { measureAllocation } from "./measure-allocation";
import { succeed } from "~/result";
import type { Result } from "~/result";

import type { Beta } from "~/units/beta";

import type { MonthlyReturn } from "~/units/monthly-return";

import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { VarianceShare } from "~/units/variance-share";
import { measureAgainstMarket, measureMarket } from "./capm";
import type {
  MarketMeasures,
  RequiredReturnMeasure,
  SecurityMarketLineMeasure,
  StockMeasures,
} from "./capm";
import type { EstimationSettings } from "./estimation-settings";
import type { Measure, MeasureFailure } from "./measure";
import { alignedReturns } from "./aligned-returns";
import type { InstrumentCloses } from "./aligned-returns";

import type {
  BetaNotPositive,
  SharpeRatioMeasure,
  TreynorRatioMeasure,
} from "./performance-ratios";
import { measureCorrelation, measureCovariance } from "./return-statistics";
import type {
  CorrelationMeasure,
  CovarianceMeasure,
  StandardDeviationMeasure,
} from "./return-statistics";

/** A stock in a portfolio, with its share of the value of the portfolio. The rest of the value is cash, which earns nothing, so it adds nothing to the expected return, the variance, or the beta. */
export interface Holding extends InstrumentCloses {
  weight: PortfolioWeight;
}

export type WeightedSumMeasure<Value> = Measure<
  "weightedSum",
  Value,
  { terms: readonly { code: string; weight: PortfolioWeight; value: Value }[] }
>;

export type PortfolioVarianceMeasure = Measure<
  "portfolioVariance",
  MonthlyVariance,
  {
    weights: readonly PortfolioWeight[];
    /** The covariance matrix of the holdings, in the order of the weights. */
    covariances: readonly (readonly MonthlyVariance[])[];
  }
>;

/** The measures of a holding against the market, with its weight and how its returns move with those of its portfolio. */
type HoldingMeasures = StockMeasures & {
  weight: PortfolioWeight;
  /** The covariance of the holding with the portfolio, which is the sum of its covariance with each holding times the weight of that holding. */
  covarianceWithPortfolio: WeightedSumMeasure<MonthlyVariance>;
};

/** The share of the variance of a portfolio that one holding adds: its weight times its covariance with the portfolio, divided by the variance of the portfolio. */
type VarianceShareMeasure = Measure<
  "varianceShare",
  VarianceShare,
  {
    weight: PortfolioWeight;
    covarianceWithPortfolio: MonthlyVariance;
    portfolioVariance: MonthlyVariance;
  }
>;

/** The risk that one holding adds to its portfolio. */
export interface HoldingRisk {
  code: string;
  varianceShare: VarianceShareMeasure;
  correlationWithPortfolio: CorrelationMeasure;
}

/** Why a portfolio has no measure that divides by its variance or its standard deviation: its returns are the same in every month, such as those of cash alone, so both are zero. */
export interface NoPortfolioVariation {
  kind: "noPortfolioVariation";
}

export interface PortfolioMeasures {
  /** The measures of each holding, in the order of the holdings. */
  holdings: HoldingMeasures[];
  market: MarketMeasures;
  /** The covariance of each pair of holdings, in the order of the holdings, with the variance of each holding on the diagonal. */
  covarianceMatrix: CovarianceMeasure[][];
  correlationMatrix: CorrelationMeasure[][];
  expectedReturn: WeightedSumMeasure<MonthlyReturn>;
  variance: PortfolioVarianceMeasure;
  standardDeviation: StandardDeviationMeasure;
  beta: WeightedSumMeasure<Beta>;
  requiredReturn: RequiredReturnMeasure;
  /** Jensen's alpha, which is how far the expected return lies above the security market line, or below it when negative. */
  securityMarketLine: SecurityMarketLineMeasure;
  sharpeRatio: Result<SharpeRatioMeasure, NoPortfolioVariation>;
  treynorRatio: Result<TreynorRatioMeasure, BetaNotPositive>;
  /** The risk that each holding adds, in the order of the holdings. */
  holdingRisks: Result<HoldingRisk[], NoPortfolioVariation>;
}

/** Measures a portfolio and each of its holdings against the market, from the returns of the months in the window of the settings in which the market and every holding have a return. */
export function measurePortfolio(
  holdings: readonly Holding[],
  market: InstrumentCloses,
  settings: EstimationSettings,
): Result<PortfolioMeasures, MeasureFailure> {
  const returns = alignedReturns(market, holdings, settings);
  if (!returns.ok) {
    return returns;
  }
  const marketMeasures = measureMarket(returns.value);
  if (!marketMeasures.ok) {
    return marketMeasures;
  }
  const stockMeasures = returns.value.instruments.map(
    ({ instrument, returns: holdingReturns }) => ({
      ...measureAgainstMarket(
        instrument.code,
        holdingReturns,
        marketMeasures.value,
      ),
      weight: instrument.weight,
    }),
  );
  const covarianceMatrix = stockMeasures.map((row) =>
    stockMeasures.map((column) => measureCovariance(row, column)),
  );
  const correlationMatrix = stockMeasures.map((row, rowIndex) =>
    stockMeasures.map((column, columnIndex) =>
      measureCorrelation({
        covariance: matrixCell(covarianceMatrix, rowIndex, columnIndex).value,
        firstStandardDeviation: row.standardDeviation.value,
        secondStandardDeviation: column.standardDeviation.value,
      }),
    ),
  );
  const { covariancesWithPortfolio, ...allocation } = measureAllocation(
    stockMeasures,
    covarianceMatrix,
    marketMeasures.value,
  );
  return succeed({
    ...allocation,
    holdings: stockMeasures.map((holding, index) => {
      const covarianceWithPortfolio = covariancesWithPortfolio[index];
      if (covarianceWithPortfolio === undefined)
        throw new Error(
          `The allocation has no covariance for ${holding.code}.`,
        );
      return { ...holding, covarianceWithPortfolio };
    }),
    market: marketMeasures.value,
    covarianceMatrix,
    correlationMatrix,
  });
}
