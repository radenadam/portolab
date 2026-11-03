import type { Database } from "~/database/database.server";
import type { MembershipId } from "~/features/classes/classes.schema";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { checkPortfolioOrders } from "./check-open-orders.server";
import { isOpenOrder } from "./open-orders";
import type { StoredOrder } from "./order-rows";
import { readStoredPortfolio, saveOrderState } from "./portfolio-store.server";
import type { OrderId } from "./trading.schema";

/** Why Portolab cancelled no order, which is a number that names no order of the portfolio, or an order that is no longer open, given as it ended. */
export type CancelFailure =
  { kind: "missing" } | { kind: "ended"; order: StoredOrder };

/** Cancels an open order of a portfolio at a moment, which returns what the order set aside. The portfolio is checked first, so an order that a fill or an expiry ended before the moment stays as it ended. Both steps run in one transaction. */
export function cancelPortfolioOrder(
  database: Database,
  { membershipId, orderId }: { membershipId: MembershipId; orderId: OrderId },
  now: Date,
): Result<undefined, CancelFailure> {
  return database.transaction((transaction) => {
    checkPortfolioOrders(transaction, membershipId, now);
    const order = readStoredPortfolio(transaction, membershipId)?.orders.find(
      (stored) => stored.id === orderId,
    );
    if (order === undefined) {
      return fail({ kind: "missing" });
    }
    if (!isOpenOrder(order, now)) {
      return fail({ kind: "ended", order });
    }
    saveOrderState(transaction, orderId, {
      kind: "cancelled",
      cancelledAt: now,
    });
    return succeed(undefined);
  });
}
