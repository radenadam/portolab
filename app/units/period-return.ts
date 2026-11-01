/** A return over one period of the frequency that the measures use, such as one month, as a fraction, such as 0.0123 for 1.23%. An expected return, a standard deviation, the risk-free rate of one period, and a distance from the security market line are returns over one period too. */
export type PeriodReturn = number & { readonly brand: "PeriodReturn" };

function isPeriodReturn(value: number): value is PeriodReturn {
  return Number.isFinite(value);
}

/** Makes a return that the program computed into a return over one period. Every return comes from positive prices and rates, so a value that is not finite is a defect. */
export function periodReturn(fraction: number): PeriodReturn {
  if (!isPeriodReturn(fraction)) {
    throw new Error(`${String(fraction)} is not a return over one period.`);
  }
  return fraction;
}
