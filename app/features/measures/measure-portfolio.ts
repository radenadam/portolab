import { succeed } from "~/result";
import type { Result } from "~/result";
import { periodReturn } from "~/units/period-return";
import type { PeriodReturn } from "~/units/period-return";
import {
  measureAgainstMarket,
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
import { alignedReturns } from "./period-returns";
import type { InstrumentCloses } from "./period-returns";
import { measureCorrelation, measureCovariance } from "./return-statistics";
import type {
  CorrelationMeasure,
  CovarianceMeasure,
  StandardDeviationMeasure,
} from "./return-statistics";
import { measureMarket } from "./stock-measures";

/** A stock in a portfolio, with its share of the value of the portfolio as a fraction, such as 0.25. The rest of the value is cash, which earns nothing, so it adds nothing to the expected return, the variance, or the beta. */
export interface Holding extends InstrumentCloses {
  weight: number;
}

type WeightedSumMeasure<Value> = Measure<
  "weightedSum",
  Value,
  { terms: readonly { code: string; weight: number; value: Value }[] }
>;

type PortfolioVarianceMeasure = Measure<
  "portfolioVariance",
  number,
  {
    weights: readonly number[];
    /** The covariance matrix of the holdings, in the order of the weights. */
    covariances: readonly (readonly number[])[];
  }
>;

export interface PortfolioMeasures {
  /** The measures of each holding against the market, in the order of the holdings. */
  holdings: (StockMeasures & { weight: number })[];
  market: MarketMeasures;
  /** The covariance of each pair of holdings, in the order of the holdings, with the variance of each holding on the diagonal. */
  covarianceMatrix: CovarianceMeasure[][];
  correlationMatrix: CorrelationMeasure[][];
  expectedReturn: WeightedSumMeasure<PeriodReturn>;
  variance: PortfolioVarianceMeasure;
  standardDeviation: StandardDeviationMeasure;
  beta: WeightedSumMeasure<number>;
  requiredReturn: RequiredReturnMeasure;
  securityMarketLine: SecurityMarketLineMeasure;
}

/** Measures a portfolio and each of its holdings against the market, from the returns of the periods in the window of the settings in which the market and every holding have a return. */
export function measurePortfolio(
  holdings: readonly Holding[],
  market: InstrumentCloses,
  settings: EstimationSettings,
): Result<PortfolioMeasures, MeasureFailure> {
  const returns = alignedReturns(market, holdings, settings);
  if (!returns.ok) {
    return returns;
  }
  const marketMeasures = measureMarket(returns.value, settings);
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
    holdingMeasures.map((column) =>
      measureCovariance(row.series, column.series),
    ),
  );
  const correlationMatrix = holdingMeasures.map((row, rowIndex) =>
    holdingMeasures.map((column, columnIndex) =>
      measureCorrelation(
        matrixCell(covarianceMatrix, rowIndex, columnIndex),
        row.series,
        column.series,
      ),
    ),
  );
  const variance = measurePortfolioVariance(holdingMeasures, covarianceMatrix);
  const expectedReturn = measureWeightedSum(
    holdingMeasures.map((holding) => ({
      code: holding.code,
      weight: holding.weight,
      value: holding.series.expectedReturn.value,
    })),
    periodReturn,
  );
  const beta = measureWeightedSum(
    holdingMeasures.map((holding) => ({
      code: holding.code,
      weight: holding.weight,
      value: holding.beta.value,
    })),
    (sum) => sum,
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
    standardDeviation: {
      formula: "squareRoot",
      value: periodReturn(Math.sqrt(variance.value)),
      inputs: { variance: variance.value },
    },
    beta,
    requiredReturn,
    securityMarketLine: measureSecurityMarketLineDistance(
      expectedReturn.value,
      requiredReturn,
    ),
  });
}

function measureWeightedSum<Value extends number>(
  terms: readonly { code: string; weight: number; value: Value }[],
  toValue: (sum: number) => Value,
): WeightedSumMeasure<Value> {
  let sum = 0;
  for (const term of terms) {
    sum += term.weight * term.value;
  }
  return { formula: "weightedSum", value: toValue(sum), inputs: { terms } };
}

function measurePortfolioVariance(
  holdings: readonly { weight: number }[],
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
    value: variance,
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
