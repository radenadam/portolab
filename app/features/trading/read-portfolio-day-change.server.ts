import type { Database } from "~/database/database.server";
import { listStockHistory } from "~/features/market-data/history-store.server";
import { latestQuoteTime } from "~/features/market-data/latest-quote-time";
import {
  latestQuoteTradingDay,
  tradingDayBefore,
} from "~/features/market-data/idx-calendar";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import { priceChange } from "~/features/market-data/price-change";
import { filledStockCodes } from "./filled-stock-codes";
import { portfolioValueAtClose } from "./portfolio-close-values";
import type { Portfolio } from "./portfolio-store.server";
import type { PortfolioValuation } from "./value-portfolio";

export type PortfolioDayChangeFailure =
  | { kind: "unpriced" }
  | { kind: "missingCalendar" }
  | { kind: "missingCloses"; date: string; codes: string[] }
  | { kind: "nonPositiveReference"; date: string; value: Rupiah };

export interface PortfolioDayChange {
  date: string;
  referenceDate: string;
  amount: Rupiah;
  return: CumulativeReturn;
}

/** A sale can remove every current share, so the comparison replays the holdings at the preceding close instead of repricing today's shares. */
export function readPortfolioDayChange(
  database: Database,
  input: {
    portfolio: Portfolio;
    valuation: PortfolioValuation;
    now: Date;
    delayMinutes: number;
  },
): Result<PortfolioDayChange, PortfolioDayChangeFailure> {
  const { portfolio, valuation, now, delayMinutes } = input;
  if (valuation.total === undefined) return fail({ kind: "unpriced" });
  const session = latestQuoteTradingDay(now, delayMinutes);
  if (!session.ok) return fail({ kind: "missingCalendar" });
  const day = comparisonDay(portfolio, valuation, session.value);
  const reference = tradingDayBefore(day);
  if (!reference.ok) return fail({ kind: "missingCalendar" });
  const before = portfolioValueAtClose(reference.value, {
    startingCash: valuation.startingCash,
    orders: portfolio.orders,
    stocks: filledStockCodes(portfolio.orders).map((code) =>
      listStockHistory(database, code),
    ),
  });
  if (!before.ok)
    return fail({
      kind: "missingCloses",
      date: reference.value,
      codes: before.failure.codes,
    });
  if (before.value <= 0)
    return fail({
      kind: "nonPositiveReference",
      date: reference.value,
      value: before.value,
    });
  return succeed({
    date: day,
    referenceDate: reference.value,
    amount: rupiah(valuation.total.value - before.value),
    return: cumulativeReturn(priceChange(valuation.total.value, before.value)),
  });
}

function comparisonDay(
  portfolio: Portfolio,
  valuation: PortfolioValuation,
  session: string,
): string {
  const quotedAt = latestQuoteTime(
    valuation.holdings.flatMap((holding) =>
      holding.kind === "priced" ? [holding.quote] : [],
    ),
  );
  // A complete sale removes its quote from the valuation but its cash change still belongs to its session.
  let latest = quotedAt === undefined ? session : wibDateOf(quotedAt);
  for (const order of portfolio.orders) {
    if (order.state.kind === "filled" && order.tradingDay > latest)
      latest = order.tradingDay;
  }
  return latest;
}
