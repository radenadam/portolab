/** How a share of an amount is rounded to a whole number: down, up, or to the nearest one with halves rounded up, as ROUND does in a spreadsheet. */
export type Rounding = "down" | "up" | "halfUp";

/** A fraction such as 15 / 10,000 for a fee of 0.15%, or 300 / 500 for 300 of the 500 shares of a holding. */
interface Fraction {
  numerator: number;
  denominator: number;
}

/** A fraction of a whole number of at least 0, rounded to a whole number, such as 15,000 for 15 / 10,000 of 10,000,000. The product of an amount and a numerator can pass the largest whole number that a double holds exactly, so the arithmetic uses BigInt. */
export function roundedShare(
  amount: number,
  fraction: Fraction,
  rounding: Rounding,
): number {
  const product = BigInt(amount) * BigInt(fraction.numerator);
  const denominator = BigInt(fraction.denominator);
  switch (rounding) {
    case "down":
      return Number(product / denominator);
    case "up":
      return Number((product + denominator - 1n) / denominator);
    case "halfUp":
      return Number((2n * product + denominator) / (2n * denominator));
  }
}
