import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { readStockCorrelation } from "~/features/measures/read-stock-correlation.server";
import { readStudentPortfolio } from "~/features/trading/read-student-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readTicket } from "~/features/trading/read-ticket.server";

/** The stock's position, correlation, and trade preview all belong to the signed-in student's portfolio. */
export function readStockPortfolio(
  context: Readonly<RouterContextProvider>,
  options: {
    request: Request;
    url: URL;
    classId: string;
    code: string;
    now: Date;
    delayMinutes: number;
  },
) {
  const reader = requireUser(context, options.url);
  const member =
    reader.role === "student"
      ? readStudentPortfolio(context, options)
      : undefined;
  const database = context.get(databaseContext);
  const report =
    member === undefined
      ? undefined
      : readPortfolioValuation(database, {
          portfolio: member.portfolio,
          startingCash: member.place.owner.startingCash,
        });
  return {
    correlation:
      report === undefined
        ? undefined
        : readStockCorrelation(database, options.code, report.valuation),
    totalValue: report?.valuation.total?.value,
    tradePreview:
      member === undefined
        ? undefined
        : readTicket(database, member.portfolio, options),
    holding: report?.valuation.holdings.find(
      (holding) => holding.code === options.code,
    ),
    portfolioNotice:
      report === undefined
        ? undefined
        : holdingQuoteFailureText([report], options),
  };
}
