import type { StockQuote } from "~/features/market-data/price-source.server";
import { quoteFailureText } from "~/features/market-data/quote-failure-text";
import type { ValuationReport } from "./read-portfolio-report.server";
import type { ValuedHolding } from "./value-portfolio";

/** The sentences that name the delayed prices of the holdings of a portfolio that the latest attempt of the quote job could not update, and when the job tries again, or undefined when the attempt updated all of them. */
export function holdingQuoteFailureText(
  report: ValuationReport,
  moment: { now: Date; delayMinutes: number },
): string | undefined {
  return quoteFailureText(
    report.quoteAttempt,
    pricedQuotes(report.valuation.holdings),
    moment,
  );
}

function pricedQuotes(holdings: readonly ValuedHolding[]): StockQuote[] {
  const quotes: StockQuote[] = [];
  for (const holding of holdings) {
    if (holding.kind === "priced") {
      quotes.push(holding.quote);
    }
  }
  return quotes;
}
