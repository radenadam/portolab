import type { Quote } from "./price-source.server";

/** The change of a quote from its previous close as a fraction, such as 0.0081 for a rise of 0.81%, whether the quote is a stock price or an index level. */
export function quoteChange(quote: Quote): number {
  return quote.kind === "stock"
    ? priceChange(quote.price, quote.previousClose)
    : priceChange(quote.level, quote.previousLevel);
}

function priceChange(last: number, previous: number): number {
  return last / previous - 1;
}
