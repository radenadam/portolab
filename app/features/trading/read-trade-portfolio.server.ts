import type { Database } from "~/database/database.server";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import type {
  ClosePrice,
  DailyClose,
  StockHistory,
} from "~/features/market-data/price-source.server";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { HeldStock } from "~/features/measures/measure-trade";
import {
  alignedReturns,
  measureCloseDates,
} from "~/features/measures/aligned-returns";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { monthSpanOf } from "~/features/measures/month-span";
import type { Portfolio } from "./portfolio-store.server";
import { isOpenOrder } from "./open-orders";
import { checkBuyable } from "./check-buyable";
import type { OrderFailure } from "./order";
import type { OrderTradingDay, TradingDayFailure } from "./order-trading-day";

/** Only open orders affect a draft, so the browser needs no completed orders or reasons. */
export function readTradePortfolio(
  database: Database,
  portfolio: Portfolio,
  {
    code,
    now,
    day,
  }: {
    code: string;
    now: Date;
    day: Result<Pick<OrderTradingDay, "date">, TradingDayFailure>;
  },
) {
  const history = listIndexHistory(database, marketIndex.code);
  const dates = measureCloseDates(history, defaultEstimationSettings);
  const market = {
    ...history,
    closes: selectPreviewCloses(history.closes, dates),
  };
  const codes = new Set([
    ...portfolio.holdings.map((holding) => holding.code),
    code,
  ]);
  const stocks: (HeldStock &
    StockHistory & {
      quotedAt: Date;
      buyable: Result<undefined, OrderFailure>;
    })[] = [];
  const unpriced: string[] = [];
  for (const stockCode of codes) {
    const quote = findStockQuote(database, stockCode);
    if (quote === undefined) {
      unpriced.push(stockCode);
    } else {
      const stock = listStockHistory(database, stockCode);
      stocks.push({
        ...stock,
        closes: selectPreviewCloses(stock.closes, dates),
        price: quote.price,
        quotedAt: quote.quotedAt,
        buyable: day.ok
          ? checkBuyable(stockCode, day.value.date, {
              closes: stock,
              marketCloses: history,
            })
          : day,
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

/** The market needs a later close to complete its last month, and forecasts need an instrument's latest close even when it has no month end. */
function selectPreviewCloses<Price extends ClosePrice>(
  closes: readonly DailyClose<Price>[],
  dates: ReadonlySet<string>,
): DailyClose<Price>[] {
  const latest = closes.at(-1);
  return closes.filter((close) => dates.has(close.date) || close === latest);
}
