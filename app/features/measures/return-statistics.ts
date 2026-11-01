import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { Measure } from "./measure";
import type { ReturnMeasure } from "./aligned-returns";

/** The expected return of an instrument, as the mean of its past returns. */
type MeanMeasure = Measure<
  "mean",
  MonthlyReturn,
  { returns: readonly MonthlyReturn[] }
>;

type VarianceMeasure = Measure<
  "sampleVariance",
  number,
  { returns: readonly MonthlyReturn[]; mean: MonthlyReturn }
>;

export type StandardDeviationMeasure = Measure<
  "squareRoot",
  MonthlyReturn,
  { variance: number }
>;

/** How the returns of two instruments, or of one instrument and the market, move together. */
export type CovarianceMeasure = Measure<
  "sampleCovariance",
  number,
  {
    firstReturns: readonly MonthlyReturn[];
    firstMean: MonthlyReturn;
    secondReturns: readonly MonthlyReturn[];
    secondMean: MonthlyReturn;
  }
>;

export type CorrelationMeasure = Measure<
  "correlation",
  number,
  {
    covariance: number;
    firstStandardDeviation: MonthlyReturn;
    secondStandardDeviation: MonthlyReturn;
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
  const mean = monthlyReturn(total / values.length);
  const variance = sampleCovariance(
    { returns: values, mean },
    { returns: values, mean },
  );
  return {
    returns,
    expectedReturn: {
      formula: "mean",
      value: mean,
      inputs: { returns: values },
    },
    variance: {
      formula: "sampleVariance",
      value: variance,
      inputs: { returns: values, mean },
    },
    standardDeviation: measureStandardDeviation(variance),
  };
}

/** Measures a standard deviation as the square root of a variance. */
export function measureStandardDeviation(
  variance: number,
): StandardDeviationMeasure {
  return {
    formula: "squareRoot",
    value: monthlyReturn(Math.sqrt(variance)),
    inputs: { variance },
  };
}

/** Measures the covariance of the returns of two instruments over the same months. */
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

// Decision 0013 explains why the sum is divided by n - 1.
function sampleCovariance(
  first: { returns: readonly number[]; mean: number },
  second: { returns: readonly number[]; mean: number },
): number {
  let sumOfProducts = 0;
  for (const [index, firstReturn] of first.returns.entries()) {
    const secondReturn = second.returns[index];
    // alignedReturns gives every instrument the same months, so returns of different lengths are a defect.
    if (
      secondReturn === undefined ||
      first.returns.length !== second.returns.length
    ) {
      throw new Error(
        `A covariance needs returns over the same months, but one instrument has ${String(first.returns.length)} returns and the other has ${String(second.returns.length)}.`,
      );
    }
    sumOfProducts += (firstReturn - first.mean) * (secondReturn - second.mean);
  }
  return sumOfProducts / (first.returns.length - 1);
}
