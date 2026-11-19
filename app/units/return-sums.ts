/** The sum of the monthly returns of an instrument as a fraction, such as -0.0614 for returns that add up to -6.14%, which its expected return divides by their number. It is a different type from a return, so a formula cannot show a sum as a monthly return by mistake. */
export type ReturnSum = number & { readonly brand: "ReturnSum" };

/** The sum of the products of the deviations of two series of monthly returns from their means, in squared monthly returns, which a sample covariance divides by the number of returns less one. Of one series with itself, it is the sum of its squared deviations, which a sample variance divides the same way. */
export type DeviationProductSum = number & {
  readonly brand: "DeviationProductSum";
};

function isReturnSum(value: number): value is ReturnSum {
  return Number.isFinite(value);
}

function isDeviationProductSum(value: number): value is DeviationProductSum {
  return Number.isFinite(value);
}

/** Makes a sum of returns that the program computed into a return sum. Every return is finite, so a sum that is not finite is a defect. */
export function returnSum(value: number): ReturnSum {
  if (!isReturnSum(value)) {
    throw new Error(`${String(value)} is not a sum of monthly returns.`);
  }
  return value;
}

/** Makes a sum of products of deviations that the program computed into its unit. Every deviation is finite, so a sum that is not finite is a defect. */
export function deviationProductSum(value: number): DeviationProductSum {
  if (!isDeviationProductSum(value)) {
    throw new Error(
      `${String(value)} is not a sum of products of deviations of monthly returns.`,
    );
  }
  return value;
}
