/** A rate for one year as a fraction, such as 0.0475 for a BI-Rate of 4.75%. It is a different type from a return over one period, so a measure cannot use a yearly rate as a monthly one by mistake. */
export type AnnualRate = number & { readonly brand: "AnnualRate" };

function isAnnualRate(value: number): value is AnnualRate {
  return Number.isFinite(value);
}

/** Makes a rate that the program itself holds, such as a constant, into a rate for one year. */
export function annualRate(fraction: number): AnnualRate {
  if (!isAnnualRate(fraction)) {
    throw new Error(`${String(fraction)} is not a rate for one year.`);
  }
  return fraction;
}
