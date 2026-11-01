import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import type { OpenOrder, Order, OrderSide, OrderState } from "./order";

const isOpenState: Record<OrderState["kind"], boolean> = {
  waiting: true,
  resting: true,
  filled: false,
  expired: false,
  rejected: false,
};

const setsAsideShares: Record<OrderSide, boolean> = {
  buy: false,
  sell: true,
};

/** The cash that the orders that are open at a moment set aside. */
export function cashSetAside(orders: readonly Order[], moment: Date): Rupiah {
  let total = 0;
  for (const order of orders) {
    if (isOpenOrder(order, moment)) {
      total += order.setAsideCash;
    }
  }
  return rupiah(total);
}

/** The shares of a stock that the sell orders that are open at a moment set aside. */
export function sharesSetAside(
  orders: readonly Order[],
  code: string,
  moment: Date,
): Shares {
  let total = 0;
  for (const order of orders) {
    if (
      isOpenOrder(order, moment) &&
      setsAsideShares[order.side] &&
      order.code === code
    ) {
      total += order.shares;
    }
  }
  return shares(total);
}

/** Whether an order is open at a moment: waiting or resting, and not past its expiry. An order whose trading day has ended stays waiting or resting until checkOrder marks it expired, so the moment decides. */
export function isOpenOrder(order: Order, moment: Date): order is OpenOrder {
  return isOpenState[order.state.kind] && moment < order.expiresAt;
}
