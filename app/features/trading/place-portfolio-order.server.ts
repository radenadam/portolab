import type { Database } from "~/database/database.server";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { checkPortfolioOrders } from "./check-open-orders.server";
import type { OrderFailure, OrderRequest } from "./order";
import { placeOrder } from "./place-order";
import type { StockState } from "./place-order";
import { readPortfolio, savePlacedOrder } from "./portfolio-store.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import type { OrderId } from "./trading.schema";

/** Places the order of a student by the rules of placeOrder and stores it. The portfolio is checked first at the moment of the order, so the order counts on the cash and the shares that fills and expiries left. After the order is stored, the check runs again, so an order that the latest quote fills fills at once. Every step runs in one transaction, so no other order can use the cash or the shares that the order counts on. */
export function placePortfolioOrder(
  database: Database,
  request: OrderRequest,
  {
    owner,
    delayMinutes,
  }: {
    owner: PortfolioOwner;
    /** How many minutes the quotes lag behind the exchange, which sets when the prices of the trading day are final. */
    delayMinutes: number;
  },
): Result<OrderId, OrderFailure> {
  const stock: StockState = {
    quote: findStockQuote(database, request.code),
    delayMinutes,
    closes: listStockHistory(database, request.code),
    marketCloses: listIndexHistory(database, marketIndex.code),
  };
  return database.transaction((transaction) => {
    checkPortfolioOrders(transaction, owner.membershipId, request.placedAt);
    const placed = placeOrder(
      request,
      readPortfolio(transaction, owner),
      stock,
    );
    if (!placed.ok) {
      return placed;
    }
    const orderId = savePlacedOrder(transaction, owner, placed.value);
    checkPortfolioOrders(transaction, owner.membershipId, request.placedAt);
    return succeed(orderId);
  });
}
