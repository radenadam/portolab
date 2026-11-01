/** How closely two series of returns move together, from -1 to 1. It has no unit, and its own type keeps it apart from betas and covariances. */
export type Correlation = number & { readonly brand: "Correlation" };

function isCorrelation(value: number): value is Correlation {
  return Number.isFinite(value);
}

/** Makes a correlation that the program computed into a correlation. The measures fail with a typed failure for returns that never change, which have no correlation, so a value that is not finite is a defect. */
export function correlation(value: number): Correlation {
  if (!isCorrelation(value)) {
    throw new Error(`${String(value)} is not a correlation.`);
  }
  return value;
}
