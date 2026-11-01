/** How strongly a return moves with the return of the market, such as 1.2 for a stock that moves 1.2% when the market moves 1%. It has no unit, and its own type keeps it apart from returns, variances, and correlations. */
export type Beta = number & { readonly brand: "Beta" };

function isBeta(value: number): value is Beta {
  return Number.isFinite(value);
}

/** Makes a beta that the program computed into a beta. The measures fail with a typed failure for a market whose returns never change, which leaves no variance to divide by, so a value that is not finite is a defect. */
export function beta(value: number): Beta {
  if (!isBeta(value)) {
    throw new Error(`${String(value)} is not a beta.`);
  }
  return value;
}
