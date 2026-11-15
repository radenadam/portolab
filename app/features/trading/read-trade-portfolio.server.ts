import type { Database } from "~/database/database.server";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { fail, succeed } from "~/result";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { StockHistory } from "~/features/market-data/price-source.server";
import type { HeldStock } from "~/features/measures/measure-trade";
import { alignedReturns } from "~/features/measures/aligned-returns";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { monthSpanOf } from "~/features/measures/month-span";
import type { Portfolio } from "./portfolio-store.server";
import { isOpenOrder } from "./open-orders";

/** Only open orders affect a draft, so the browser needs no completed orders or reasons. */
export function readTradePortfolio(
  database: Database,
  portfolio: Portfolio,
  { code, now }: { code: string; now: Date },
) {
  const codes = new Set([
    ...portfolio.holdings.map((holding) => holding.code),
    code,
  ]);
  const stocks: (HeldStock & StockHistory & { quotedAt: Date })[] = [];
  const unpriced: string[] = [];
  for (const stockCode of codes) {
    const quote = findStockQuote(database, stockCode);
    if (quote === undefined) {
      unpriced.push(stockCode);
    } else {
      stocks.push({
        ...listStockHistory(database, stockCode),
        price: quote.price,
        quotedAt: quote.quotedAt,
        shares:
          portfolio.holdings.find((holding) => holding.code === stockCode)
            ?.shares ?? shares(0),
      });
    }
  }
  if (unpriced.length > 0) return fail(unpriced);
  let total = portfolio.cash;
  for (const stock of stocks)
    total = rupiah(total + stock.price * stock.shares);
  const market = listIndexHistory(database, marketIndex.code);
  const aligned = alignedReturns(market, stocks, defaultEstimationSettings);
  return succeed({
    stocks,
    total,
    market,
    months: aligned.ok ? monthSpanOf(aligned.value.market) : undefined,
    account: {
      cash: portfolio.cash,
      holdings: portfolio.holdings,
      orders: portfolio.orders
        .filter((order) => isOpenOrder(order, now))
        .map((order) => ({ ...order, reason: undefined })),
    },
  });
}
