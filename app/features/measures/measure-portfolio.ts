import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { beta as toBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { monthlyVariance } from "~/units/monthly-variance";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { varianceShare } from "~/units/variance-share";
import type { VarianceShare } from "~/units/variance-share";
import {
  measureAgainstMarket,
  measureMarket,
  measureRequiredReturn,
  measureSecurityMarketLineDistance,
} from "./capm";
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
import { measureSharpeRatio, measureTreynorRatio } from "./performance-ratios";
import type {
  BetaNotPositive,
  SharpeRatioMeasure,
  TreynorRatioMeasure,
} from "./performance-ratios";
import {
  measureCorrelation,
  measureCovariance,
  measureStandardDeviation,
} from "./return-statistics";
import type {
  CorrelationMeasure,
  CovarianceMeasure,
  StandardDeviationMeasure,
} from "./return-statistics";

/** A stock in a portfolio, with its share of the value of the portfolio. The rest of the value is cash, which earns nothing, so it adds nothing to the expected return, the variance, or the beta. */
export interface Holding extends InstrumentCloses {
  weight: PortfolioWeight;
}

type WeightedSumMeasure<Value> = Measure<
  "weightedSum",
  Value,
  { terms: readonly { code: string; weight: PortfolioWeight; value: Value }[] }
>;

type PortfolioVarianceMeasure = Measure<
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
interface HoldingRisk {
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
  const holdingMeasures = stockMeasures.map((holding, rowIndex) => ({
    ...holding,
    covarianceWithPortfolio: measureWeightedSum(
      stockMeasures.map((column, columnIndex) => ({
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
  const requiredReturn = measureRequiredReturn(
    beta.value,
    marketMeasures.value,
  );
  const excessReturn = {
    expectedReturn: expectedReturn.value,
    riskFreeRate: marketMeasures.value.riskFreeRate.value,
  };
  const noVariation: NoPortfolioVariation = { kind: "noPortfolioVariation" };
  const hasVariation = variance.value > 0;
  return succeed({
    holdings: holdingMeasures,
    market: marketMeasures.value,
    covarianceMatrix,
    correlationMatrix,
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
  });
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
  covarianceMatrix: readonly (readonly CovarianceMeasure[])[],
): PortfolioVarianceMeasure {
  const weights = holdings.map((holding) => holding.weight);
  let variance = 0;
  for (const [rowIndex, rowWeight] of weights.entries()) {
    for (const [columnIndex, columnWeight] of weights.entries()) {
      variance +=
        rowWeight *
        columnWeight *
        matrixCell(covarianceMatrix, rowIndex, columnIndex).value;
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
  holding: HoldingMeasures,
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

// Every matrix here has a row and a column for each holding, so a missing cell is a defect.
function matrixCell<Cell>(
  matrix: readonly (readonly Cell[])[],
  rowIndex: number,
  columnIndex: number,
): Cell {
  const cell = matrix[rowIndex]?.[columnIndex];
  if (cell === undefined) {
    throw new Error(
      `The matrix has no cell in row ${String(rowIndex + 1)} and column ${String(columnIndex + 1)}.`,
    );
  }
  return cell;
}
