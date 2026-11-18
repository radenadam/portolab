/** The lists of Pasar by the start of the anchor of each row, so that a return address leads back to the row that a person left. */
export type MarketRowPrefix = "stock" | "watched-stock";

export function marketRowId(prefix: MarketRowPrefix, code: string): string {
  return `${prefix}-${code}`;
}
