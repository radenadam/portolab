/** A variance of monthly returns, or a covariance of two series of them, in squared monthly returns, such as 0.0027 for a standard deviation of about 5.2% a month. It is a different type from a return, so a measure cannot take a variance as a standard deviation by mistake. */
export type MonthlyVariance = number & { readonly brand: "MonthlyVariance" };

function isMonthlyVariance(value: number): value is MonthlyVariance {
  return Number.isFinite(value);
}

/** Makes a variance or a covariance that the program computed into a monthly variance. Every one comes from finite returns, so a value that is not finite is a defect. */
export function monthlyVariance(value: number): MonthlyVariance {
  if (!isMonthlyVariance(value)) {
    throw new Error(`${String(value)} is not a variance of monthly returns.`);
  }
  return value;
}
