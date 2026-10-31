/** An amount of Indonesian rupiah. Amounts are whole numbers, because IDX prices and cash never use fractions of a rupiah. */
export type Rupiah = number & { readonly brand: "Rupiah" };

export function isRupiah(value: number): value is Rupiah {
  return Number.isSafeInteger(value);
}
