import type { StockQuote } from "~/features/market-data/price-source.server";
import type { Result } from "~/result";
import type { Rupiah } from "~/units/rupiah";
import type { Holding } from "./holding-after-fill";
import type { StockHistories } from "./check-buyable";
import type { OpenOrder, Order, OrderFailure, OrderRequest } from "./order";
import { orderTradingDay } from "./order-trading-day";
import { placeOrderOnDay } from "./place-order-on-day";
import { checkBuyable } from "./check-buyable";
import { succeed } from "~/result";

/** What an account holds when a student places an order. */
export interface AccountState {
  cash: Rupiah;
  holdings: readonly Holding[];
  /** The orders of the account. The open ones set aside cash and shares. */
  orders: readonly Order[];
}

/** What Portolab knows of the stock of an order and of the market. */
export interface StockState extends StockHistories {
  /** The latest delayed quote of the stock, or undefined while Portolab has none, such as before the first update of prices after the stock joins the stocks that Portolab tracks. */
  quote: StockQuote | undefined;
  /** How many minutes the quotes lag behind the exchange, which sets when the prices of a day are final. */
  delayMinutes: number;
}

/** Checks an order against the rules of IDX of its trading day and against the account, by the rules of decisions 0015 and 0016, and accepts it as waiting. Its lots come from parseOrderLots with the largest order of the same trading day, which orderTradingDay gives. The caller then checks it against the latest quote with checkOrder, as after every new quote, so an order placed during a session can fill at once. */
export function placeOrder(
  request: OrderRequest,
  account: AccountState,
  stock: StockState,
): Result<OpenOrder, OrderFailure> {
  const day = orderTradingDay(request.placedAt, stock.delayMinutes);
  return day.ok
    ? placeOrderOnDay(request, account, {
        stock: {
          ...stock,
          buyable:
            request.side === "buy"
              ? checkBuyable(request.code, day.value.date, stock)
              : succeed(undefined),
        },
        day: day.value,
      })
    : day;
}
