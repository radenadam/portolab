import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readStockCorrelation } from "~/features/measures/read-stock-correlation.server";
import { readTradingPortfolio } from "~/features/trading/read-trading-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readTicket } from "~/features/trading/read-ticket.server";
import { holdingQuoteTimes } from "~/features/trading/value-portfolio";
import { stockReturnDestination } from "./stock-return-destination.server";

/** The stock's position, navigation, correlation, and trade preview must share the portfolio of the signed-in reader. */
export function readStockPortfolio(
  context: Readonly<RouterContextProvider>,
  options: {
    request: Request;
    url: URL;
    classId: string;
    code: string;
    watched: boolean;
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
    ...stockReturnDestination({
      classId: member.place.classId,
      portfolioKind: member.place.owner.kind,
      url: options.url,
      request: options.request,
      code: options.code,
      watched: options.watched,
    }),
    correlation: readStockCorrelation(database, options.code, report.valuation),
    totalValue: report.valuation.total?.value,
    portfolioQuotes: holdingQuoteTimes(report.valuation.holdings),
    tradePreview: readTicket(database, member.portfolio, options),
    holding: report.valuation.holdings.find(
      (holding) => holding.code === options.code,
    ),
    portfolioNotice: holdingQuoteFailureText([report], options),
  };
}
