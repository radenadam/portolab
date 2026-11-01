/** A return over one month as a fraction, such as 0.0123 for 1.23%. An expected return, a standard deviation, the risk-free rate of one month, and a distance from the security market line are returns over one month too. */
export type MonthlyReturn = number & { readonly brand: "MonthlyReturn" };

function isMonthlyReturn(value: number): value is MonthlyReturn {
  return Number.isFinite(value);
}

/** Makes a return that the program computed into a return over one month. Every return comes from positive prices and rates, so a value that is not finite is a defect. */
export function monthlyReturn(fraction: number): MonthlyReturn {
  if (!isMonthlyReturn(fraction)) {
    throw new Error(`${String(fraction)} is not a return over one month.`);
  }
  return fraction;
}
