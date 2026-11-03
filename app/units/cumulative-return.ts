/** The change of a value from a start as a fraction, such as 0.0123 for a gain of 1.23% and -1 for the loss of everything: the return of a portfolio since its starting cash, of the IHSG since the same close, or of a holding since its cost. */
export type CumulativeReturn = number & { readonly brand: "CumulativeReturn" };

function isCumulativeReturn(value: number): value is CumulativeReturn {
  return Number.isFinite(value);
}

/** Makes a return that the program computed from a start into a cumulative return. Every start is a positive amount or level, so a value that is not finite is a defect. */
export function cumulativeReturn(fraction: number): CumulativeReturn {
  if (!isCumulativeReturn(fraction)) {
    throw new Error(`${String(fraction)} is not a return since a start.`);
  }
  return fraction;
}
