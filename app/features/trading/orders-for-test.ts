import {
  indexHistoryForTest,
  stockHistoryForTest,
} from "~/features/market-data/history-for-test";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import type { OrderLots } from "~/units/lots";
import { successValueForTest } from "~/success-value-for-test";
import { rupiah } from "~/units/rupiah";
import type { OpenOrder, OrderRequest } from "./order";
import { orderTradingDay } from "./order-trading-day";
import { placeOrder } from "./place-order";
import type { AccountState, StockState } from "./place-order";
import { parseOrderLots } from "./parse-order-lots";

// The moments of Monday 2 November 2026, in WIB, for a source that lags 10 minutes behind the exchange.
const delayMinutes = 10;
/** 10:00, in session I. */
export const duringSessionForTest = new Date("2026-11-02T03:00:00Z");
/** 16:25, the last minute before the prices of the day are final. */
export const lastMinuteOfMondayForTest = new Date("2026-11-02T09:25:00Z");
/** 16:26, when the prices of the day are final and the open orders of the day expire. */
export const endOfMondayForTest = new Date("2026-11-02T09:26:00Z");

/** The trading day that orderTradingDay gives to an order placed at 10:00 WIB on Monday 2 November 2026, which is that Monday with its rules and costs. */
export const mondayTradingDayForTest = successValueForTest(
  orderTradingDay(duringSessionForTest, delayMinutes),
  "Monday 2 November 2026 has recorded rules and costs",
);

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

/** The size of an order as the order form gives it, from a whole number of lots up to the largest order of Monday 2 November 2026. */
export function orderLotsForTest(count: number): OrderLots {
  return successValueForTest(
    parseOrderLots(
      String(count),
      "Lots",
      mondayTradingDayForTest.rules.maximumLots,
    ),
    `${String(count)} lots are a valid order`,
  );
}

/** The close of BBCA of Friday 30 October 2026, which fixture-price-source.server.ts records, quoted at 16:14 WIB after the close of Rp4,940 on Thursday. It is the latest quote of BBCA until the session of Monday 2 November 2026 opens. */
export const bbcaCloseOfFridayForTest = stockQuote(
  "BBCA",
  [4_980, 4_940],
  "2026-10-30T09:14:55Z",
);

/** BBCA at 10:00 WIB on Monday 2 November 2026: its latest delayed quote, quoted at 09:50, the delay of 10 minutes, and the month-end closes of BBCA and the IHSG, whose last close of BBCA is the Rp4,980 of Friday 30 October 2026 that the quote states. */
export const bbcaForTest: StockState & { quote: StockQuote } = {
  quote: stockQuote("BBCA", [4_980, 4_980], "2026-11-02T02:50:00Z"),
  delayMinutes,
  closes: stockHistoryForTest(monthEndClosesForTest("BBCA")),
  marketCloses: indexHistoryForTest(monthEndClosesForTest("IHSG")),
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
