import { placeAndCheckSampleTrade } from "~/features/trading/sample-trades";
import type { AccountState } from "~/features/trading/place-order";
import type { OrderRequest } from "~/features/trading/order";
import { minuteMilliseconds } from "~/time-units";
import type {
  IndexHistory,
  StockQuote,
} from "~/features/market-data/price-source.server";

import { largestAffordableCount } from "~/features/trading/largest-affordable-count";
import { orderTradingDay } from "~/features/trading/order-trading-day";
import { isOrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";

import { wibDateOf } from "~/wib";
import { fail, succeed } from "~/result";

import type { SampleStock } from "./read-sample-market.server";

export interface SampleRecipe {
  stocks: readonly SampleStock[];
  marketCloses: IndexHistory;
  startingCash: Rupiah;
  delayMinutes: number;
  now: Date;
  currentQuotes: ReadonlyMap<string, StockQuote>;
}

export function tradeAtClose(
  recipe: SampleRecipe,
  account: AccountState,
  {
    stock,
    quote,
    minutesBeforeQuote = 1,
    ...request
  }: {
    stock: SampleStock;
    quote: StockQuote;
    minutesBeforeQuote?: number;
  } & Omit<OrderRequest, "code" | "placedAt">,
) {
  return placeAndCheckSampleTrade(
    {
      ...request,
      code: quote.code,
      placedAt: new Date(
        quote.quotedAt.getTime() - minutesBeforeQuote * minuteMilliseconds,
      ),
    },
    account,
    stockAt(stock, quote, recipe),
  );
}

export function stockAt(
  stock: SampleStock,
  quote: StockQuote,
  recipe: SampleRecipe,
) {
  const date = wibDateOf(quote.quotedAt);
  return {
    quote,
    delayMinutes: recipe.delayMinutes,
    closes: {
      ...stock.history,
      closes: stock.history.closes.filter((close) => close.date <= date),
    },
    marketCloses: {
      ...recipe.marketCloses,
      closes: recipe.marketCloses.closes.filter((close) => close.date <= date),
    },
  };
}

export function sizeFor(
  cash: Rupiah,
  order: { price: Rupiah; placedAt: Date },
  recipe: SampleRecipe,
) {
  const day = orderTradingDay(order.placedAt, recipe.delayMinutes);
  if (!day.ok) return day;
  const count = Math.min(
    day.value.rules.maximumLots,
    largestAffordableCount(
      cash,
      rupiah(order.price * day.value.rules.lotShares),
      day.value.rates,
    ),
  );
  return isOrderLots(count)
    ? succeed(count)
    : fail({ kind: "noAffordableLots" } as const);
}
