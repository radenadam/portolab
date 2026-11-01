import { periodReturn } from "~/units/period-return";
import type { PeriodReturn } from "~/units/period-return";
import type { Measure } from "./measure";
import type { ReturnMeasure } from "./period-returns";

/** The expected return of an instrument, as the mean of its past returns. */
type MeanMeasure = Measure<
  "mean",
  PeriodReturn,
  { returns: readonly PeriodReturn[] }
>;

type VarianceMeasure = Measure<
  "sampleVariance",
  number,
  { returns: readonly PeriodReturn[]; mean: PeriodReturn }
>;

export type StandardDeviationMeasure = Measure<
  "squareRoot",
  PeriodReturn,
  { variance: number }
>;

/** How the returns of two instruments, or of one instrument and the market, move together. */
export type CovarianceMeasure = Measure<
  "sampleCovariance",
  number,
  {
    firstReturns: readonly PeriodReturn[];
    firstMean: PeriodReturn;
    secondReturns: readonly PeriodReturn[];
    secondMean: PeriodReturn;
  }
>;

export type CorrelationMeasure = Measure<
  "correlation",
  number,
  {
    covariance: number;
    firstStandardDeviation: PeriodReturn;
    secondStandardDeviation: PeriodReturn;
  }
>;

/** The measures of one instrument that come from its own returns alone. */
export interface SeriesMeasures {
  returns: readonly ReturnMeasure[];
  expectedReturn: MeanMeasure;
  variance: VarianceMeasure;
  standardDeviation: StandardDeviationMeasure;
}

/** Measures the expected return, the variance, and the standard deviation of the returns of one instrument. */
export function measureSeries(
  returns: readonly ReturnMeasure[],
): SeriesMeasures {
  const values = returns.map((measure) => measure.value);
  let total = 0;
  for (const value of values) {
    total += value;
  }
  const expectedReturn: MeanMeasure = {
    formula: "mean",
    value: periodReturn(total / values.length),
    inputs: { returns: values },
  };
  const variance: VarianceMeasure = {
    formula: "sampleVariance",
    value: sampleCovariance(
      { returns: values, mean: expectedReturn.value },
      { returns: values, mean: expectedReturn.value },
    ),
    inputs: { returns: values, mean: expectedReturn.value },
  };
  return {
    returns,
    expectedReturn,
    variance,
    standardDeviation: {
      formula: "squareRoot",
      value: periodReturn(Math.sqrt(variance.value)),
      inputs: { variance: variance.value },
    },
  };
}

/** Measures the covariance of the returns of two instruments over the same periods. */
export function measureCovariance(
  first: SeriesMeasures,
  second: SeriesMeasures,
): CovarianceMeasure {
  const firstReturns = first.expectedReturn.inputs.returns;
  const secondReturns = second.expectedReturn.inputs.returns;
  const firstMean = first.expectedReturn.value;
  const secondMean = second.expectedReturn.value;
  return {
    formula: "sampleCovariance",
    value: sampleCovariance(
      { returns: firstReturns, mean: firstMean },
      { returns: secondReturns, mean: secondMean },
    ),
    inputs: { firstReturns, firstMean, secondReturns, secondMean },
  };
}

/** Measures the correlation of the returns of two instruments from their covariance and their standard deviations. */
export function measureCorrelation(
  covariance: CovarianceMeasure,
  first: SeriesMeasures,
  second: SeriesMeasures,
): CorrelationMeasure {
  const firstStandardDeviation = first.standardDeviation.value;
  const secondStandardDeviation = second.standardDeviation.value;
  return {
    formula: "correlation",
    value:
      covariance.value / (firstStandardDeviation * secondStandardDeviation),
    inputs: {
      covariance: covariance.value,
      firstStandardDeviation,
      secondStandardDeviation,
    },
  };
}

// The sum is divided by n - 1, because the returns are a sample of the returns of the instrument, as VAR.S and COVARIANCE.S do.
function sampleCovariance(
  first: { returns: readonly number[]; mean: number },
  second: { returns: readonly number[]; mean: number },
): number {
  let sumOfProducts = 0;
  for (const [index, firstReturn] of first.returns.entries()) {
    const secondReturn = second.returns[index];
    // alignedReturns gives every instrument the same periods, so returns of different lengths are a defect.
    if (
      secondReturn === undefined ||
      first.returns.length !== second.returns.length
    ) {
      throw new Error(
        `A covariance needs returns over the same periods, but one instrument has ${String(first.returns.length)} returns and the other has ${String(second.returns.length)}.`,
      );
    }
    sumOfProducts += (firstReturn - first.mean) * (secondReturn - second.mean);
  }
  return sumOfProducts / (first.returns.length - 1);
}
