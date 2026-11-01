/** An amount of Indonesian rupiah. Amounts are whole numbers, because IDX prices and cash never use fractions of a rupiah. */
export type Rupiah = number & { readonly brand: "Rupiah" };

export function isRupiah(value: number): value is Rupiah {
  return Number.isSafeInteger(value);
}

/** Makes an amount that the program itself holds, such as a constant, into rupiah. Outside data goes through isRupiah instead, which never throws. */
export function rupiah(amount: number): Rupiah {
  if (!isRupiah(amount)) {
    throw new Error(`${String(amount)} is not a whole number of rupiah.`);
  }
  return amount;
}
