/** A number of shares of one stock, such as the 500 shares of a holding of 5 lots. Shares are whole, because IDX trades no fractions of a share. */
export type Shares = number & { readonly brand: "Shares" };

function isShares(value: number): value is Shares {
  return Number.isSafeInteger(value) && value >= 0;
}

/** Makes a number of shares that the program computed into shares. Every number of shares comes from whole lots, so a value that is negative or not whole is a defect. */
export function shares(count: number): Shares {
  if (!isShares(count)) {
    throw new Error(`${String(count)} is not a whole number of shares.`);
  }
  return count;
}
