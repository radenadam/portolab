import type { StockQuote } from "~/features/market-data/price-source.server";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { lots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";
import { successValueForTest } from "~/success-value-for-test";
import { rupiah } from "~/units/rupiah";
import type { OpenOrder, OrderRequest } from "./order";
import { placeOrder } from "./place-order";
import type { AccountState, StockState } from "./place-order";
import { parseOrderLots } from "./parse-order-lots";

// The moments of Monday 2 November 2026, in WIB, for a source that lags 10 minutes behind the exchange.
/** 10:00, in session I. */
export const duringSessionForTest = new Date("2026-11-02T03:00:00Z");
/** 16:25, the last minute before the prices of the day are final. */
export const lastMinuteOfMondayForTest = new Date("2026-11-02T09:25:00Z");
/** 16:26, when the prices of the day are final and the open orders of the day expire. */
export const endOfMondayForTest = new Date("2026-11-02T09:26:00Z");

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

/** The size of an order of a number of lots from 1, as the order form gives it. The test reads it with no bound below the largest safe number, so that placeOrder applies the largest order of the trading day. */
export function orderLotsForTest(count: number): OrderLots {
  return successValueForTest(
    parseOrderLots(String(count), "Lots", lots(Number.MAX_SAFE_INTEGER)),
    `${String(count)} lots are a valid order`,
  );
}

/** BBCA at 10:00 WIB on Monday 2 November 2026: its latest delayed quote, quoted at 09:50, the delay of 10 minutes, and the month-end closes of BBCA and the IHSG. */
export const bbcaForTest: StockState & { quote: StockQuote } = {
  quote: quoteForTest("BBCA", 4_980, "2026-11-02T02:50:00Z"),
  delayMinutes: 10,
  closes: monthEndClosesForTest("BBCA"),
  marketCloses: monthEndClosesForTest("IHSG"),
};

/** A market purchase of 5 lots of BBCA at 10:00 WIB on Monday 2 November 2026, with the changes of a test. */
export function purchaseForTest(
  changes: Partial<OrderRequest> = {},
): OrderRequest {
  return {
    code: "BBCA",
    side: "buy",
    lots: orderLotsForTest(5),
    price: { kind: "market" },
    placedAt: duringSessionForTest,
    ...changes,
  };
}

/** A market sale of 5 lots of BBCA at 10:00 WIB on Monday 2 November 2026, with the changes of a test. */
export function saleForTest(changes: Partial<OrderRequest> = {}): OrderRequest {
  return purchaseForTest({ side: "sell", ...changes });
}

/** An account with Rp100 million in cash, no holdings, and no orders, with the changes of a test. */
export function accountForTest(
  changes: Partial<AccountState> = {},
): AccountState {
  return { cash: rupiah(100_000_000), holdings: [], orders: [], ...changes };
}
