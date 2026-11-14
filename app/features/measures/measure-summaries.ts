import { succeed } from "~/result";
import type { Result } from "~/result";
import type { Beta } from "~/units/beta";
import type { Correlation } from "~/units/correlation";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import type { SharpeRatio } from "~/units/sharpe-ratio";
import type { VarianceShare } from "~/units/variance-share";
import type { ReturnMeasure } from "./aligned-returns";
import type {
  MarketLine,
  MarketMeasures,
  RequiredReturnMeasure,
  SecurityMarketLineMeasure,
  StockMeasures,
} from "./capm";
import type { NoPortfolioVariation } from "./measure-portfolio";
import type { ValuedPortfolioMeasures } from "./measure-valued-portfolio";
import type { RiskFreeRateMeasure } from "./measure-risk-free-rate";
import type { BetaNotPositive } from "./performance-ratios";
import type { CorrelationMeasure } from "./return-statistics";

// A measure holds its inputs, so the returns of an instrument recur in the mean, the variance, and each covariance. A page shows each return once, in the table of its instrument, so these summaries keep the returns once and the other measures by their values, which keeps a page small on mobile data.

/** The measures of the market that a page shows, over the months of the stock or the portfolio beside it. */
export interface MarketSummary {
  returns: readonly ReturnMeasure[];
  expectedReturn: MonthlyReturn;
  variance: MonthlyVariance;
  standardDeviation: MonthlyReturn;
  riskFreeRate: RiskFreeRateMeasure;
  sharpeRatio: SharpeRatio;
}

/** The measures of one stock against the market that its page shows. */
export interface StockSummary {
  code: string;
  returns: readonly ReturnMeasure[];
  expectedReturn: MonthlyReturn;
  variance: MonthlyVariance;
  standardDeviation: MonthlyReturn;
  covarianceWithMarket: MonthlyVariance;
  correlationWithMarket: CorrelationMeasure;
  beta: StockMeasures["beta"];
  requiredReturn: RequiredReturnMeasure;
  securityMarketLine: SecurityMarketLineMeasure;
  market: MarketSummary;
}

/** The measures of a stock that a table of every stock shows, with the line of its months and its distance from that line, which a chart of the security market line places it by. */
export interface StockRowSummary {
  expectedReturn: MonthlyReturn;
  standardDeviation: MonthlyReturn;
  beta: Beta;
  line: MarketLine;
  /** How far the expected return lies above the security market line, or below it when negative, which is α. */
  distance: MonthlyReturn;
}

/** A stock of a portfolio with its value, its weight, and the measures that the table of the stocks of the portfolio shows. */
interface HoldingSummary {
  code: string;
  value: Rupiah;
  weight: PortfolioWeight;
  expectedReturn: MonthlyReturn;
  beta: Beta;
  /** How far the expected return lies above the security market line of the months of the portfolio, or below it when negative, which is α. */
  distance: MonthlyReturn;
  returns: readonly ReturnMeasure[];
}

/** The share of the variance of a portfolio that one of its stocks adds, with the weight of the stock and its covariance with the portfolio from which the share comes, and the correlation of the stock with the portfolio. */
export interface HoldingRiskSummary {
  code: string;
  weight: PortfolioWeight;
  covarianceWithPortfolio: MonthlyVariance;
  varianceShare: VarianceShare;
  correlationWithPortfolio: Correlation;
}

/** The covariance and the correlation of two stocks of a portfolio, or of one stock with itself, whose covariance is its variance. */
interface PairSummary {
  first: string;
  second: string;
  covariance: MonthlyVariance;
  correlation: Correlation;
}

/** The measures of a portfolio that its page shows. */
export interface PortfolioSummary {
  expectedReturn: MonthlyReturn;
  variance: MonthlyVariance;
  standardDeviation: MonthlyReturn;
  beta: Beta;
  requiredReturn: RequiredReturnMeasure;
  securityMarketLine: SecurityMarketLineMeasure;
  sharpeRatio: Result<SharpeRatio, NoPortfolioVariation>;
  treynorRatio: Result<MonthlyReturn, BetaNotPositive>;
  /** In the order of the portfolio. */
  holdingRisks: Result<HoldingRiskSummary[], NoPortfolioVariation>;
  cash: { value: Rupiah; weight: PortfolioWeight };
  /** The value of the holdings and the cash, of which each weight is a share. */
  totalValue: Rupiah;
  /** In the order of the portfolio. */
  holdings: HoldingSummary[];
  /** Each pair of stocks once, in the order of the portfolio, each stock first with itself. */
  pairs: PairSummary[];
  market: MarketSummary;
}

export function summarizeMarket(market: MarketMeasures): MarketSummary {
  return {
    returns: market.returns,
    expectedReturn: market.expectedReturn.value,
    variance: market.variance.value,
    standardDeviation: market.standardDeviation.value,
    riskFreeRate: market.riskFreeRate,
    sharpeRatio: market.sharpeRatio.value,
  };
}

export function summarizeStock({
  stock,
  market,
}: {
  stock: StockMeasures;
  market: MarketMeasures;
}): StockSummary {
  return {
    code: stock.code,
    returns: stock.returns,
    expectedReturn: stock.expectedReturn.value,
    variance: stock.variance.value,
    standardDeviation: stock.standardDeviation.value,
    covarianceWithMarket: stock.covarianceWithMarket.value,
    correlationWithMarket: stock.correlationWithMarket,
    beta: stock.beta,
    requiredReturn: stock.requiredReturn,
    securityMarketLine: stock.securityMarketLine,
    market: summarizeMarket(market),
  };
}

export function summarizeStockRow(stock: StockMeasures): StockRowSummary {
  const { riskFreeRate, marketExpectedReturn } = stock.requiredReturn.inputs;
  return {
    expectedReturn: stock.expectedReturn.value,
    standardDeviation: stock.standardDeviation.value,
    beta: stock.beta.value,
    line: { riskFreeRate, marketExpectedReturn },
    distance: stock.securityMarketLine.value,
  };
}

/** Summarizes the measures of a portfolio with the values from which measureValuedPortfolio weighed its holdings and its cash. */
export function summarizePortfolio(
  measures: ValuedPortfolioMeasures,
  values: {
    holdings: readonly { code: string; value: Rupiah }[];
    cash: Rupiah;
    total: Rupiah;
  },
): PortfolioSummary {
  const pairs: PairSummary[] = [];
  for (const [rowIndex, row] of measures.holdings.entries()) {
    for (const [columnIndex, column] of measures.holdings.entries()) {
      if (columnIndex < rowIndex) {
        continue;
      }
      const covariance = measures.covarianceMatrix[rowIndex]?.[columnIndex];
      const correlation = measures.correlationMatrix[rowIndex]?.[columnIndex];
      // measurePortfolio gives each matrix a row and a column for each holding, so a missing cell is a defect.
      if (covariance === undefined || correlation === undefined) {
        throw new Error(
          `The matrices of the portfolio have no cell for ${row.code} and ${column.code}.`,
        );
      }
      pairs.push({
        first: row.code,
        second: column.code,
        covariance: covariance.value,
        correlation: correlation.value,
      });
    }
  }
  return {
    expectedReturn: measures.expectedReturn.value,
    variance: measures.variance.value,
    standardDeviation: measures.standardDeviation.value,
    beta: measures.beta.value,
    requiredReturn: measures.requiredReturn,
    securityMarketLine: measures.securityMarketLine,
    sharpeRatio: measures.sharpeRatio.ok
      ? succeed(measures.sharpeRatio.value.value)
      : measures.sharpeRatio,
    treynorRatio: measures.treynorRatio.ok
      ? succeed(measures.treynorRatio.value.value)
      : measures.treynorRatio,
    holdingRisks: measures.holdingRisks.ok
      ? succeed(
          measures.holdingRisks.value.map((risk) => ({
            code: risk.code,
            weight: risk.varianceShare.inputs.weight,
            covarianceWithPortfolio:
              risk.varianceShare.inputs.covarianceWithPortfolio,
            varianceShare: risk.varianceShare.value,
            correlationWithPortfolio: risk.correlationWithPortfolio.value,
          })),
        )
      : measures.holdingRisks,
    cash: { value: values.cash, weight: measures.cashWeight },
    totalValue: values.total,
    holdings: measures.holdings.map((holding) => ({
      code: holding.code,
      value: valueOf(holding.code, values.holdings),
      weight: holding.weight,
      expectedReturn: holding.expectedReturn.value,
      beta: holding.beta.value,
      distance: holding.securityMarketLine.value,
      returns: holding.returns,
    })),
    pairs,
    market: summarizeMarket(measures.market),
  };
}

// measureStoredPortfolio measures exactly the holdings whose values it receives, so a holding without a value is a defect.
function valueOf(
  code: string,
  holdings: readonly { code: string; value: Rupiah }[],
): Rupiah {
  const holding = holdings.find((candidate) => candidate.code === code);
  if (holding === undefined) {
    throw new Error(
      `The portfolio has measures of ${code} but no value of it.`,
    );
  }
  return holding.value;
}
