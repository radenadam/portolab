import { succeed } from "~/result";
import type { Result } from "~/result";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { Measure, MeasureFailure } from "./measure";
import { measureRiskFreeRate } from "./measure-risk-free-rate";
import type { RiskFreeRateMeasure } from "./measure-risk-free-rate";
import type { AlignedReturns, ReturnMeasure } from "./aligned-returns";
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

type BetaMeasure = Measure<
  "beta",
  number,
  { covarianceWithMarket: number; marketVariance: number }
>;

/** The return that CAPM requires for the risk that a beta measures. */
export type RequiredReturnMeasure = Measure<
  "capm",
  MonthlyReturn,
  {
    riskFreeRate: MonthlyReturn;
    beta: number;
    marketExpectedReturn: MonthlyReturn;
  }
>;

/** How far the expected return lies above the security market line, or below it when negative. */
export type SecurityMarketLineMeasure = Measure<
  "securityMarketLineDistance",
  MonthlyReturn,
  { expectedReturn: MonthlyReturn; requiredReturn: MonthlyReturn }
>;

/** The measures of the market, with the risk-free rate, which every stock and portfolio measured over the same months shares, so they all lie on one security market line. */
export type MarketMeasures = SeriesMeasures & {
  riskFreeRate: RiskFreeRateMeasure;
};

/** The measures of one stock against the market, from returns over the same months as those of the market. */
export type StockMeasures = SeriesMeasures & {
  code: string;
  covarianceWithMarket: CovarianceMeasure;
  correlationWithMarket: CorrelationMeasure;
  beta: BetaMeasure;
  requiredReturn: RequiredReturnMeasure;
  securityMarketLine: SecurityMarketLineMeasure;
};

/** Measures the returns of the market, with the risk-free rate on the day that ends the window. */
export function measureMarket(
  returns: AlignedReturns<unknown>,
): Result<MarketMeasures, MeasureFailure> {
  const riskFreeRate = measureRiskFreeRate(returns.windowEnd);
  if (!riskFreeRate.ok) {
    return riskFreeRate;
  }
  return succeed({
    ...measureSeries(returns.market),
    riskFreeRate: riskFreeRate.value,
  });
}

/** Measures a stock against the market from its returns, which must cover the same months as the returns of the market. */
export function measureAgainstMarket(
  code: string,
  returns: readonly ReturnMeasure[],
  market: MarketMeasures,
): StockMeasures {
  const series = measureSeries(returns);
  const covarianceWithMarket = measureCovariance(series, market);
  const beta: BetaMeasure = {
    formula: "beta",
    value: covarianceWithMarket.value / market.variance.value,
    inputs: {
      covarianceWithMarket: covarianceWithMarket.value,
      marketVariance: market.variance.value,
    },
  };
  const requiredReturn = measureRequiredReturn(beta.value, market);
  return {
    ...series,
    code,
    covarianceWithMarket,
    correlationWithMarket: measureCorrelation(
      covarianceWithMarket,
      series,
      market,
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
  const marketExpectedReturn = market.expectedReturn.value;
  return {
    formula: "capm",
    value: monthlyReturn(
      riskFreeRate + beta * (marketExpectedReturn - riskFreeRate),
    ),
    inputs: { riskFreeRate, beta, marketExpectedReturn },
  };
}

/** Measures how far an expected return lies from the security market line, at the return that CAPM requires. */
export function measureSecurityMarketLineDistance(
  expectedReturn: MonthlyReturn,
  requiredReturn: RequiredReturnMeasure,
): SecurityMarketLineMeasure {
  return {
    formula: "securityMarketLineDistance",
    value: monthlyReturn(expectedReturn - requiredReturn.value),
    inputs: { expectedReturn, requiredReturn: requiredReturn.value },
  };
}
