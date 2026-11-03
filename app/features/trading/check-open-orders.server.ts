import type { Database, DatabaseWriter } from "~/database/database.server";
import type { MembershipId } from "~/features/classes/classes.schema";
import { listFreshStockQuotes } from "~/features/market-data/quote-store.server";
import { rupiah } from "~/units/rupiah";
import { checkOrder } from "./check-order";
import { holdingAfterFill } from "./holding-after-fill";
import type { Holding } from "./holding-after-fill";
import { cashSetAside, hasOpenState, sharesOfStock } from "./open-orders";
import {
  listPortfoliosWithOpenOrders,
  readStoredPortfolio,
  saveFill,
  saveOrderState,
} from "./portfolio-store.server";
import type { StoredOrder } from "./order-rows";

/** Checks each waiting or resting order of a portfolio at a moment, in the order in which the student placed them, against the quote of its stock that the latest update of prices fetched, and stores each state that changed. A fill moves the cash and the holding of its stock, so each later order of the check sees them. The caller runs it in a transaction, so a fill never stores its order without its cash. */
export function checkPortfolioOrders(
  database: DatabaseWriter,
  membershipId: MembershipId,
  now: Date,
): void {
  const portfolio = readStoredPortfolio(database, membershipId);
  if (portfolio === undefined) {
    return;
  }
  const quotes = listFreshStockQuotes(database);
  let { cash } = portfolio;
  const holdings = new Map<string, Holding>();
  for (const holding of portfolio.holdings) {
    holdings.set(holding.code, holding);
  }
  const orders: StoredOrder[] = [...portfolio.orders];
  for (const [index, order] of orders.entries()) {
    if (!hasOpenState(order)) {
      continue;
    }
    const others = orders.filter((other) => other.id !== order.id);
    const state = checkOrder({
      order,
      quote: quotes.get(order.code),
      moment: now,
      availableCash: rupiah(cash - cashSetAside(others, now).amount),
      sharesOfStock: sharesOfStock(
        { holdings: [...holdings.values()], orders: others },
        order.code,
        now,
      ),
    });
    if (state.kind === order.state.kind) {
      continue;
    }
    saveOrderState(database, order.id, state);
    orders[index] = { ...order, state };
    if (state.kind === "filled") {
      cash = rupiah(cash + state.fill.cashChange);
      const holding = holdingAfterFill(
        holdings.get(order.code),
        order,
        state.fill,
      );
      holdings.set(order.code, holding);
      saveFill(database, membershipId, { cash, holding });
    }
  }
}

/** Checks the open orders of every portfolio at a moment, each portfolio in a transaction of its own, which the price job runs after each update of quotes. */
export function checkAllOpenOrders(database: Database, now: Date): void {
  for (const membershipId of listPortfoliosWithOpenOrders(database)) {
    database.transaction((transaction) => {
      checkPortfolioOrders(transaction, membershipId, now);
    });
  }
}
