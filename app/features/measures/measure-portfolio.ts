import { succeed } from "~/result";
import type { Result } from "~/result";
import { beta as toBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { monthlyVariance } from "~/units/monthly-variance";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
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

export interface PortfolioMeasures {
  /** The measures of each holding against the market, in the order of the holdings. */
  holdings: (StockMeasures & { weight: PortfolioWeight })[];
  market: MarketMeasures;
  /** The covariance of each pair of holdings, in the order of the holdings, with the variance of each holding on the diagonal. */
  covarianceMatrix: CovarianceMeasure[][];
  correlationMatrix: CorrelationMeasure[][];
  expectedReturn: WeightedSumMeasure<MonthlyReturn>;
  variance: PortfolioVarianceMeasure;
  standardDeviation: StandardDeviationMeasure;
  beta: WeightedSumMeasure<Beta>;
  requiredReturn: RequiredReturnMeasure;
  securityMarketLine: SecurityMarketLineMeasure;
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
  const holdingMeasures = returns.value.instruments.map(
    ({ instrument, returns: holdingReturns }) => ({
      ...measureAgainstMarket(
        instrument.code,
        holdingReturns,
        marketMeasures.value,
      ),
      weight: instrument.weight,
    }),
  );
  const covarianceMatrix = holdingMeasures.map((row) =>
    holdingMeasures.map((column) => measureCovariance(row, column)),
  );
  const correlationMatrix = holdingMeasures.map((row, rowIndex) =>
    holdingMeasures.map((column, columnIndex) =>
      measureCorrelation(
        matrixCell(covarianceMatrix, rowIndex, columnIndex),
        row,
        column,
      ),
    ),
  );
  const variance = measurePortfolioVariance(holdingMeasures, covarianceMatrix);
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
  return succeed({
    holdings: holdingMeasures,
    market: marketMeasures.value,
    covarianceMatrix,
    correlationMatrix,
    expectedReturn,
    variance,
    standardDeviation: measureStandardDeviation(variance.value),
    beta,
    requiredReturn,
    securityMarketLine: measureSecurityMarketLineDistance(
      expectedReturn.value,
      requiredReturn,
    ),
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
