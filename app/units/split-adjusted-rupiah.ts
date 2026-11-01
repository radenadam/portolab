/** A price of one share in rupiah, adjusted for every stock split after its date, as Yahoo Finance gives the daily closes of a stock. A split divides a whole price, so the price can have a fraction of a rupiah, and it is never an amount of money that changes hands. */
export type SplitAdjustedRupiah = number & {
  readonly brand: "SplitAdjustedRupiah";
};

/** Whether a number from outside the program can be a split-adjusted price, which is a positive finite number. */
export function isSplitAdjustedRupiah(
  value: number,
): value is SplitAdjustedRupiah {
  return Number.isFinite(value) && value > 0;
}

/** Makes a price that the program itself holds, such as a constant, into a split-adjusted price. Outside data goes through isSplitAdjustedRupiah instead, which never throws. */
export function splitAdjustedRupiah(price: number): SplitAdjustedRupiah {
  if (!isSplitAdjustedRupiah(price)) {
    throw new Error(`${String(price)} is not a price of a share.`);
  }
  return price;
}
