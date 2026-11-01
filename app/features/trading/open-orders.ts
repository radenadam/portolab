import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import type { Holding } from "./holding-after-fill";
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

/** Whether an account holds shares of any stock beyond what its open sell orders set aside at a moment, which it could sell. */
export function holdsFreeShares(
  account: { holdings: readonly Holding[]; orders: readonly Order[] },
  moment: Date,
): boolean {
  return account.holdings.some(
    (holding) =>
      holding.shares > sharesSetAside(account.orders, holding.code, moment),
  );
}

/** Whether an order is open at a moment: waiting or resting, and not past its expiry. An order whose trading day has ended stays waiting or resting until checkOrder marks it expired, so the moment decides. */
export function isOpenOrder(order: Order, moment: Date): order is OpenOrder {
  return isOpenState[order.state.kind] && moment < order.expiresAt;
}
