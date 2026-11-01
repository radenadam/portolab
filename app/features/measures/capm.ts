import { periodReturn } from "~/units/period-return";
import type { PeriodReturn } from "~/units/period-return";
import type { Measure } from "./measure";
import type { ReturnMeasure } from "./period-returns";
import {
  measureCorrelation,
  measureCovariance,
  measureSeries,
} from "./return-statistics";
import type {
  CorrelationMeasure,
  CovarianceMeasure,
  SeriesMeasures,
} from "./return-statistics";
import type { RiskFreeRateMeasure } from "./measure-risk-free-rate";

type BetaMeasure = Measure<
  "beta",
  number,
  { covarianceWithMarket: number; marketVariance: number }
>;

/** The return that CAPM requires for the risk that a beta measures. */
export type RequiredReturnMeasure = Measure<
  "capm",
  PeriodReturn,
  {
    riskFreeRate: PeriodReturn;
    beta: number;
    marketExpectedReturn: PeriodReturn;
  }
>;

/** How far the expected return lies above the security market line, or below it when negative. */
export type SecurityMarketLineMeasure = Measure<
  "securityMarketLineDistance",
  PeriodReturn,
  { expectedReturn: PeriodReturn; requiredReturn: PeriodReturn }
>;

/** The market and the risk-free rate, which every stock and portfolio measured on the same periods shares, so they all lie on one security market line. */
export interface MarketMeasures {
  series: SeriesMeasures;
  riskFreeRate: RiskFreeRateMeasure;
}

/** The measures of one stock against the market, from returns over the same periods as those of the market. */
export interface StockMeasures {
  code: string;
  series: SeriesMeasures;
  covarianceWithMarket: CovarianceMeasure;
  correlationWithMarket: CorrelationMeasure;
  beta: BetaMeasure;
  requiredReturn: RequiredReturnMeasure;
  securityMarketLine: SecurityMarketLineMeasure;
}

/** Measures a stock against the market from its returns, which must cover the same periods as the returns of the market. */
export function measureAgainstMarket(
  code: string,
  returns: readonly ReturnMeasure[],
  market: MarketMeasures,
): StockMeasures {
  const series = measureSeries(returns);
  const covarianceWithMarket = measureCovariance(series, market.series);
  const beta: BetaMeasure = {
    formula: "beta",
    value: covarianceWithMarket.value / market.series.variance.value,
    inputs: {
      covarianceWithMarket: covarianceWithMarket.value,
      marketVariance: market.series.variance.value,
    },
  };
  const requiredReturn = measureRequiredReturn(beta.value, market);
  return {
    code,
    series,
    covarianceWithMarket,
    correlationWithMarket: measureCorrelation(
      covarianceWithMarket,
      series,
      market.series,
    ),
    beta,
    requiredReturn,
    securityMarketLine: measureSecurityMarketLineDistance(
      series.expectedReturn.value,
      requiredReturn,
    ),
  };
}

/** Measures the return that CAPM requires for a beta, with the risk-free rate and the expected return of the market. */
export function measureRequiredReturn(
  beta: number,
  market: MarketMeasures,
): RequiredReturnMeasure {
  const riskFreeRate = market.riskFreeRate.value;
  const marketExpectedReturn = market.series.expectedReturn.value;
  return {
    formula: "capm",
    value: periodReturn(
      riskFreeRate + beta * (marketExpectedReturn - riskFreeRate),
    ),
    inputs: { riskFreeRate, beta, marketExpectedReturn },
  };
}

/** Measures how far an expected return lies from the security market line, at the return that CAPM requires. */
export function measureSecurityMarketLineDistance(
  expectedReturn: PeriodReturn,
  requiredReturn: RequiredReturnMeasure,
): SecurityMarketLineMeasure {
  return {
    formula: "securityMarketLineDistance",
    value: periodReturn(expectedReturn - requiredReturn.value),
    inputs: { expectedReturn, requiredReturn: requiredReturn.value },
  };
}
