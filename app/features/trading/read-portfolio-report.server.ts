import type { Database } from "~/database/database.server";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { readLatestUpdateAttempt } from "~/features/market-data/update-attempts.server";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import { succeed } from "~/result";
import type { Result } from "~/result";
import type { Rupiah } from "~/units/rupiah";
import { historyStartDate, portfolioHistory } from "./portfolio-history";
import type { MissingCalendar, PortfolioHistory } from "./portfolio-history";
import type { Portfolio } from "./portfolio-store.server";
import { valuePortfolio } from "./value-portfolio";
import type { PortfolioValuation } from "./value-portfolio";

/** A portfolio of a student in a class as its page shows it at a moment. */
export interface PortfolioReport {
  valuation: PortfolioValuation;
  /** The latest attempt of the quote job, with only the codes of the holdings among the prices that it could not update. */
  quoteAttempt: UpdateAttempt | undefined;
  history: Result<PortfolioHistory, MissingCalendar>;
}

/** Values a portfolio at the latest delayed prices, and replays its return since the start at the stored closes, for a student who joined the class at a moment with its starting cash. */
export function readPortfolioReport(
  database: Database,
  member: { portfolio: Portfolio; startingCash: Rupiah; joinedAt: Date },
  { now, delayMinutes }: { now: Date; delayMinutes: number },
): PortfolioReport {
  const { portfolio, startingCash } = member;
  const quotes = new Map<string, StockQuote>();
  for (const holding of portfolio.holdings) {
    const quote = findStockQuote(database, holding.code);
    if (quote !== undefined) {
      quotes.set(holding.code, quote);
    }
  }
  const attempt = readLatestUpdateAttempt(database, "quotes");
  const startDate = historyStartDate(member.joinedAt);
  return {
    valuation: valuePortfolio(portfolio, startingCash, quotes),
    quoteAttempt:
      attempt === undefined
        ? undefined
        : {
            ...attempt,
            failedCodes: attempt.failedCodes.filter((code) =>
              portfolio.holdings.some((holding) => holding.code === code),
            ),
          },
    history: startDate.ok
      ? succeed(
          portfolioHistory({
            startingCash,
            startDate: startDate.value,
            orders: portfolio.orders,
            // The returns of the IHSG can count from a close before the start, when the source left out the close of the start.
            market: listIndexHistory(database, marketIndex.code),
            stocks: filledCodes(portfolio).map((code) =>
              listStockHistory(database, code, startDate.value),
            ),
            now,
            delayMinutes,
          }),
        )
      : startDate,
  };
}

function filledCodes(portfolio: Portfolio): string[] {
  const codes = new Set<string>();
  for (const order of portfolio.orders) {
    if (order.state.kind === "filled") {
      codes.add(order.code);
    }
  }
  return [...codes];
}
