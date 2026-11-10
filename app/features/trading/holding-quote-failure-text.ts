import type { StockQuote } from "~/features/market-data/price-source.server";
import { quoteFailureText } from "~/features/market-data/quote-failure-text";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import type { ValuationReport } from "./read-portfolio-report.server";

/** The sentences that name the delayed prices of the holdings of one portfolio or of several, such as every portfolio of a class, that the latest attempt of the quote job could not update, and when the job tries again, or undefined when the attempt updated all of them. */
export function holdingQuoteFailureText(
  reports: readonly ValuationReport[],
  moment: { now: Date; delayMinutes: number },
): string | undefined {
  let attempt: UpdateAttempt | undefined;
  const failedCodes = new Set<string>();
  const quotes: StockQuote[] = [];
  for (const report of reports) {
    // Each report narrows the same latest attempt to the codes of its own holdings, so together they narrow it to the holdings of every portfolio.
    if (report.quoteAttempt !== undefined) {
      attempt = report.quoteAttempt;
      for (const code of report.quoteAttempt.failedCodes) {
        failedCodes.add(code);
      }
    }
    for (const holding of report.valuation.holdings) {
      if (holding.kind === "priced") {
        quotes.push(holding.quote);
      }
    }
  }
  return quoteFailureText(
    attempt === undefined
      ? undefined
      : // The quote job records its failures in the order of the tracked codes, which is by code, so the codes of several portfolios keep that order.
        { ...attempt, failedCodes: [...failedCodes].sort() },
    quotes,
    moment,
  );
}
