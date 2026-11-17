import type { Database } from "~/database/database.server";
import {
  findStockQuote,
  listFreshStockQuotes,
} from "~/features/market-data/quote-store.server";
import { listStockHistory } from "~/features/market-data/history-store.server";
import { succeed } from "~/result";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { acceptedPriceRange } from "./accepted-prices";
import { cashSetAside, sharesOfStock } from "./open-orders";
import { orderTradingDay } from "./order-trading-day";
import type { Portfolio } from "./portfolio-store.server";
import { referencePrice } from "./reference-price";
import {
  attemptForCodes,
  missingQuoteText,
  quoteFailureText,
} from "~/features/market-data/quote-failure-text";
import { readLatestUpdateAttempt } from "~/features/market-data/update-attempts.server";
import { isPriceOfOrder } from "./check-order";
import { readTradePortfolio } from "./read-trade-portfolio.server";

/** The browser needs draft quantities without the student's full order history. */
export function readTicket(
  database: Database,
  portfolio: Portfolio,
  {
    code,
    now,
    delayMinutes,
  }: { code: string; now: Date; delayMinutes: number },
) {
  const day = orderTradingDay(now, delayMinutes);
  const quote = findStockQuote(database, code);
  const fresh = listFreshStockQuotes(database).get(code);
  const attempt = attemptForCodes(readLatestUpdateAttempt(database, "quotes"), [
    code,
  ]);
  const stock = sharesOfStock(portfolio, code, now);
  const reference =
    day.ok && quote !== undefined
      ? referencePrice(
          code,
          { quote, closes: listStockHistory(database, code) },
          day.value,
        )
      : undefined;
  return {
    impact: readTradePortfolio(database, portfolio, {
      code,
      now,
      day,
    }),
    now,
    day,
    quote,
    canFillNow:
      day.ok &&
      fresh !== undefined &&
      isPriceOfOrder(
        { tradingDay: day.value.date, tradesFrom: day.value.tradesFrom },
        fresh.quotedAt,
      ),
    quoteNotice:
      quote === undefined
        ? missingQuoteText(code, attempt, { now, delayMinutes })
        : quoteFailureText(attempt, [quote], { now, delayMinutes }),
    available: rupiah(
      portfolio.cash - cashSetAside(portfolio.orders, now).amount,
    ),
    free: day.ok
      ? lots(
          Math.floor(
            (stock.held - stock.setAside.amount) / day.value.rules.lotShares,
          ),
        )
      : lots(0),
    range:
      reference === undefined || !day.ok
        ? undefined
        : reference.ok
          ? succeed(acceptedPriceRange(reference.value, day.value.rules))
          : reference,
  };
}
