import type { Database } from "~/database/database.server";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import type {
  IndexQuote,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { attemptForCodes } from "~/features/market-data/quote-failure-text";
import {
  findIndexQuote,
  findStockQuote,
} from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { readLatestUpdateAttempt } from "~/features/market-data/update-attempts.server";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import { succeed } from "~/result";
import type { Result } from "~/result";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { Rupiah } from "~/units/rupiah";
import {
  historyStartDate,
  marketReturnSinceStart,
  portfolioHistory,
} from "./portfolio-history";
import type { MissingCalendar, PortfolioHistory } from "./portfolio-history";
import type { Portfolio } from "./portfolio-store.server";
import { valuePortfolio } from "./value-portfolio";
import { filledStockCodes } from "./filled-stock-codes";
import type { PortfolioValuation } from "./value-portfolio";

/** A portfolio of a student in a class at the latest delayed prices of its holdings. */
export interface ValuationReport {
  valuation: PortfolioValuation;
  /** The latest attempt of the quote job, with only the codes of the prices that the page shows among the prices that it could not update. */
  quoteAttempt: UpdateAttempt | undefined;
}

/** The latest delayed level of the IHSG, and its return since the close from which the returns of a portfolio count, which covers the same time as the return of the portfolio since its starting cash. */
interface MarketSinceStart {
  quote: IndexQuote;
  return: CumulativeReturn;
}

/** A portfolio of a student in a class as its page shows it at a moment. */
export type PortfolioReport = ValuationReport & {
  history: Result<PortfolioHistory, MissingCalendar>;
  /** Undefined while Portolab has no delayed level of the IHSG, or the history has no close to count from. */
  market: MarketSinceStart | undefined;
};

/** Values a portfolio at the latest delayed prices of its holdings, against the starting cash of its class. A page that also shows the delayed level of an index names it among the codes of its prices. */
export function readPortfolioValuation(
  database: Database,
  { portfolio, startingCash }: { portfolio: Portfolio; startingCash: Rupiah },
  shownIndexCodes: readonly string[] = [],
): ValuationReport {
  const quotes = new Map<string, StockQuote>();
  for (const holding of portfolio.holdings) {
    const quote = findStockQuote(database, holding.code);
    if (quote !== undefined) {
      quotes.set(holding.code, quote);
    }
  }
  return {
    valuation: valuePortfolio(portfolio, startingCash, quotes),
    quoteAttempt: attemptForCodes(readLatestUpdateAttempt(database, "quotes"), [
      ...shownIndexCodes,
      ...portfolio.holdings.map((holding) => holding.code),
    ]),
  };
}

/** Values a portfolio at the latest delayed prices, and replays its return since the start at the stored closes, for a student who joined the class at a moment with its starting cash, with the return of the IHSG over the same time. */
export function readPortfolioReport(
  database: Database,
  member: { portfolio: Portfolio; startingCash: Rupiah; joinedAt: Date },
  { now, delayMinutes }: { now: Date; delayMinutes: number },
): PortfolioReport {
  const { portfolio, startingCash } = member;
  const startDate = historyStartDate(member.joinedAt);
  // The returns of the IHSG can count from a close before the start, when the source left out the close of the start.
  const marketHistory = listIndexHistory(database, marketIndex.code);
  const indexQuote = findIndexQuote(database, marketIndex.code);
  const marketReturn =
    startDate.ok && indexQuote !== undefined
      ? marketReturnSinceStart(
          {
            startDate: startDate.value,
            market: marketHistory,
            now,
            delayMinutes,
          },
          indexQuote.level,
        )
      : undefined;
  const market =
    indexQuote === undefined || marketReturn === undefined
      ? undefined
      : { quote: indexQuote, return: marketReturn };
  return {
    ...readPortfolioValuation(
      database,
      { portfolio, startingCash },
      market === undefined ? [] : [marketIndex.code],
    ),
    history: startDate.ok
      ? succeed(
          portfolioHistory({
            startingCash,
            startDate: startDate.value,
            orders: portfolio.orders,
            market: marketHistory,
            stocks: filledStockCodes(portfolio.orders).map((code) =>
              listStockHistory(database, code, startDate.value),
            ),
            now,
            delayMinutes,
          }),
        )
      : startDate,
    market,
  };
}
