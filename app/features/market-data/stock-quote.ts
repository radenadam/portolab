import { rupiah } from "~/units/rupiah";
import type { StockQuote } from "./price-source.server";

/** A delayed quote of a stock from prices that the program holds, such as an answer of a source that it recorded: the price, the close of the trading day before it, and the moment of the quote. */
export function stockQuote(
  code: string,
  [price, previousClose]: readonly [number, number],
  quotedAt: string,
): StockQuote {
  return {
    kind: "stock",
    code,
    price: rupiah(price),
    previousClose: rupiah(previousClose),
    quotedAt: new Date(quotedAt),
  };
}
