import type { StockQuote } from "~/features/market-data/price-source.server";
import type { OrderLots } from "~/units/lots";
import { successValueForTest } from "~/success-value-for-test";
import { rupiah } from "~/units/rupiah";
import type { OpenOrder, OrderRequest } from "./order";
import { placeOrder } from "./place-order";
import type { AccountState, StockState } from "./place-order";
import { parseOrderLots } from "./parse-order-lots";

/** A delayed quote of a stock whose previous close is Rp4,940, the close of BBCA on 30 October 2026. */
export function quoteForTest(
  code: string,
  price: number,
  quotedAt: string,
): StockQuote {
  return {
    kind: "stock",
    code,
    price: rupiah(price),
    previousClose: rupiah(4_940),
    quotedAt: new Date(quotedAt),
  };
}

/** The price of a limit order. */
export function limitForTest(limit: number): OrderRequest["price"] {
  return { kind: "limit", limit: rupiah(limit) };
}

/** The order that placeOrder accepts for a request that the test knows to be valid. */
export function acceptedForTest(
  request: OrderRequest,
  account: AccountState,
  stock: StockState,
): OpenOrder {
  return successValueForTest(
    placeOrder(request, account, stock),
    "The order is valid",
  );
}

/** The size of an order of a number of lots from 1, as the order form gives it. */
export function orderLotsForTest(count: number): OrderLots {
  return successValueForTest(
    parseOrderLots(String(count), "Lots"),
    `${String(count)} lots are a valid order`,
  );
}
