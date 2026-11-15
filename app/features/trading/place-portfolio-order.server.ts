import type { Database } from "~/database/database.server";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { checkPortfolioOrders } from "./check-open-orders.server";
import type { OrderFailure, OrderRequest } from "./order";
import { placeOrder } from "./place-order";
import type { StockState } from "./place-order";
import { readPortfolio, savePlacedOrder } from "./portfolio-store.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import type { OrderId } from "./trading.schema";
import { orderTradingDay } from "./order-trading-day";
import { ticketAmounts } from "./ticket-amounts";
import type { Rupiah } from "~/units/rupiah";

/** Places the order of a student by the rules of placeOrder and stores it. The portfolio is checked first at the moment of the order, so the order counts on the cash and the shares that fills and expiries left. After the order is stored, the check runs again, so an order that the latest quote fills fills at once. Every step runs in one transaction, so no other order can use the cash or the shares that the order counts on. */
export function placePortfolioOrder(
  database: Database,
  request: OrderRequest,
  {
    owner,
    delayMinutes,
    seenTotal,
  }: {
    owner: PortfolioOwner;
    /** How many minutes the quotes lag behind the exchange, which sets when the prices of the trading day are final. */
    delayMinutes: number;
    seenTotal: Rupiah | null;
  },
): Result<OrderId, OrderFailure | { kind: "previewChanged" }> {
  return database.transaction((transaction) => {
    const stock: StockState = {
      quote: findStockQuote(database, request.code),
      delayMinutes,
      closes: listStockHistory(database, request.code),
      marketCloses: listIndexHistory(database, marketIndex.code),
    };
    checkPortfolioOrders(transaction, owner.membershipId, request.placedAt);
    const placed = placeOrder(
      request,
      readPortfolio(transaction, owner),
      stock,
    );
    if (!placed.ok) {
      return placed;
    }
    const day = orderTradingDay(request.placedAt, delayMinutes);
    if (!day.ok) return day;
    const amounts = ticketAmounts(request.side, {
      price: placed.value.checkedPrice,
      shares: placed.value.shares,
      rates: day.value.rates,
      available: owner.startingCash,
    });
    if (seenTotal !== amounts.total) return fail({ kind: "previewChanged" });
    const orderId = savePlacedOrder(transaction, owner, placed.value);
    checkPortfolioOrders(transaction, owner.membershipId, request.placedAt);
    return succeed(orderId);
  });
}
