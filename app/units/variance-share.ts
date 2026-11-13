/** The share of the variance of a portfolio that one of its stocks adds, as a fraction, such as 0.58 for 58%. The shares of the stocks of a portfolio add up to 1, but one share can lie below 0 or above 1, so it is not a weight. */
export type VarianceShare = number & { readonly brand: "VarianceShare" };

function isVarianceShare(value: number): value is VarianceShare {
  return Number.isFinite(value);
}

/** Makes a share of the variance of a portfolio that the program computed into a variance share. The measures give none for a portfolio whose variance is zero, so a value that is not finite is a defect. */
export function varianceShare(fraction: number): VarianceShare {
  if (!isVarianceShare(fraction)) {
    throw new Error(
      `${String(fraction)} is not a share of the variance of a portfolio.`,
    );
  }
  return fraction;
}
