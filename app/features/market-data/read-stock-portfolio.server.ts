import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readStockCorrelation } from "~/features/measures/read-stock-correlation.server";
import { readTradingPortfolio } from "~/features/trading/read-trading-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readTicket } from "~/features/trading/read-ticket.server";

/** The stock's position, correlation, and trade preview must share the portfolio of the signed-in reader. */
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
  const member = readTradingPortfolio(context, options);
  const database = context.get(databaseContext);
  const report = readPortfolioValuation(database, {
    portfolio: member.portfolio,
    startingCash: member.place.owner.startingCash,
  });
  return {
    portfolioKind: member.place.owner.kind,
    correlation: readStockCorrelation(database, options.code, report.valuation),
    totalValue: report.valuation.total?.value,
    tradePreview: readTicket(database, member.portfolio, options),
    holding: report.valuation.holdings.find(
      (holding) => holding.code === options.code,
    ),
    portfolioNotice: holdingQuoteFailureText([report], options),
  };
}
