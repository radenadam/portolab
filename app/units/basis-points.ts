/** A rate in hundredths of a percent, such as 15 for a fee of 0.15% or 700 for a limit of 7%. Every rate of IDX and of the fees is a whole number of basis points, so an amount at a rate is exact in whole numbers. */
export type BasisPoints = number & { readonly brand: "BasisPoints" };

function isBasisPoints(value: number): value is BasisPoints {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Makes a rate that the program itself holds, such as a fee in the data, into basis points. */
export function basisPoints(rate: number): BasisPoints {
  if (!isBasisPoints(rate)) {
    throw new Error(`${String(rate)} is not a whole number of basis points.`);
  }
  return rate;
}

/** The basis points in a whole, which is 100%. */
export const basisPointsPerWhole = 10_000;
