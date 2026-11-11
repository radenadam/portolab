import type { Quote } from "~/features/market-data/price-source.server";
import { quoteFailureText } from "~/features/market-data/quote-failure-text";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import type {
  PortfolioReport,
  ValuationReport,
} from "./read-portfolio-report.server";

/** The sentences that name the delayed prices that the page of one portfolio or of several, such as every portfolio of a class, shows and that the latest attempt of the quote job could not update, and when the job tries again, or undefined when the attempt updated all of them. The prices are those of the holdings, and the level of the IHSG of a report that shows it. */
export function holdingQuoteFailureText(
  reports: readonly (ValuationReport &
    Partial<Pick<PortfolioReport, "market">>)[],
  moment: { now: Date; delayMinutes: number },
): string | undefined {
  let attempt: UpdateAttempt | undefined;
  const failedCodes = new Set<string>();
  const quotes: Quote[] = [];
  for (const report of reports) {
    // Each report narrows the same latest attempt to the codes of its own prices, so together they narrow it to the prices of every portfolio.
    if (report.quoteAttempt !== undefined) {
      attempt = report.quoteAttempt;
      for (const code of report.quoteAttempt.failedCodes) {
        failedCodes.add(code);
      }
    }
    if (report.market !== undefined) {
      quotes.push(report.market.quote);
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
      : // The codes of several portfolios are sorted by code, as the quote job sorts the stocks that it tracks.
        { ...attempt, failedCodes: [...failedCodes].sort() },
    quotes,
    moment,
  );
}
