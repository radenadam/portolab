/** The return of a portfolio above the risk-free rate for each unit of its standard deviation, such as -0.15. Both are returns over one month, so the ratio has no unit, and its own type keeps it apart from returns, betas, and correlations. */
export type SharpeRatio = number & { readonly brand: "SharpeRatio" };

function isSharpeRatio(value: number): value is SharpeRatio {
  return Number.isFinite(value);
}

/** Makes a Sharpe ratio that the program computed into a Sharpe ratio. The measures give none for a portfolio whose standard deviation is zero, so a value that is not finite is a defect. */
export function sharpeRatio(value: number): SharpeRatio {
  if (!isSharpeRatio(value)) {
    throw new Error(`${String(value)} is not a Sharpe ratio.`);
  }
  return value;
}
