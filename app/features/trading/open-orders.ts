import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import type { Holding } from "./holding-after-fill";
import type {
  OpenOrder,
  OpenSales,
  Order,
  OrderSide,
  OrderState,
  SetAside,
} from "./order";

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

/** The cash that the orders that are open at a moment set aside, and how many of them set some aside. */
export function cashSetAside(
  orders: readonly Order[],
  moment: Date,
): SetAside<Rupiah> {
  let amount = 0;
  let count = 0;
  for (const order of orders) {
    if (isOpenOrder(order, moment) && order.setAsideCash > 0) {
      amount += order.setAsideCash;
      count += 1;
    }
  }
  return { amount: rupiah(amount), orders: count };
}

/** The shares of a stock that the sell orders that are open at a moment set aside, and how many orders they are. */
export function sharesSetAside(
  orders: readonly Order[],
  code: string,
  moment: Date,
): SetAside<Shares> {
  let amount = 0;
  let count = 0;
  for (const order of orders) {
    if (
      isOpenOrder(order, moment) &&
      setsAsideShares[order.side] &&
      order.code === code
    ) {
      amount += order.shares;
      count += 1;
    }
  }
  return { amount: shares(amount), orders: count };
}

/** Whether an account holds shares of any stock beyond what its open sell orders set aside at a moment, which it could sell. */
export function holdsFreeShares(
  account: { holdings: readonly Holding[]; orders: readonly Order[] },
  moment: Date,
): boolean {
  return account.holdings.some(
    (holding) =>
      holding.shares >
      sharesSetAside(account.orders, holding.code, moment).amount,
  );
}

/** The sell orders that are open at a moment: the stocks that they sell, each once, and how many orders they are. They bring cash when they fill. */
export function openSales(orders: readonly Order[], moment: Date): OpenSales {
  const codes = new Set<string>();
  let count = 0;
  for (const order of orders) {
    if (isOpenOrder(order, moment) && setsAsideShares[order.side]) {
      codes.add(order.code);
      count += 1;
    }
  }
  return { codes: [...codes].sort(), orders: count };
}

/** Whether the state of an order is waiting or resting, which makes it an order that checkOrder still has to fill or mark expired, even after its expiry. */
export function hasOpenState(order: Order): order is OpenOrder {
  return isOpenState[order.state.kind];
}

/** Whether an order is open at a moment: waiting or resting, and not past its expiry. An order whose trading day has ended keeps the state waiting or resting until checkOrder marks it expired, so the moment decides whether it still sets aside cash or shares. */
export function isOpenOrder(order: Order, moment: Date): order is OpenOrder {
  return hasOpenState(order) && moment < order.expiresAt;
}
