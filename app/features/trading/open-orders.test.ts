import { expect, test } from "vitest";
import { orderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Order, OrderSide, OrderState } from "./order";
import { cashSetAside, isOpenOrder, sharesSetAside } from "./open-orders";

// The comment of each moment gives the time in WIB on Monday 2 November 2026.

// 10:00.
const placedAt = new Date("2026-11-02T03:00:00Z");
// 16:25, the last minute before the prices of the day are final for a source that lags 10 minutes.
const lastMinuteOfDay = new Date("2026-11-02T09:25:00Z");
// 16:26.
const endOfDay = new Date("2026-11-02T09:26:00Z");

// Only a purchase sets aside cash, and 1 lot at Rp4,980 with its fee sets aside Rp498,747.
const setAsideCashOf: Record<OrderSide, Rupiah> = {
  buy: rupiah(498_747),
  sell: rupiah(0),
};

function order(side: OrderSide, code: string, state: OrderState): Order {
  return {
    code,
    side,
    lots: orderLots(1),
    price: { kind: "market" },
    placedAt,
    shares: shares(100),
    tradingDay: "2026-11-02",
    tradesFrom: new Date("2026-11-02T02:00:00Z"),
    expiresAt: endOfDay,
    checkedPrice: rupiah(4_980),
    setAsideCash: setAsideCashOf[side],
    state,
  };
}

const waiting: OrderState = { kind: "waiting" };
const resting: OrderState = { kind: "resting" };
const expired: OrderState = { kind: "expired", expiredAt: placedAt };

test("counts the cash that open purchases set aside, and none of orders that are done or of sales", () => {
  expect(
    cashSetAside(
      [
        order("buy", "BBCA", waiting),
        order("buy", "TLKM", resting),
        order("buy", "BBCA", expired),
        order("sell", "BBCA", waiting),
      ],
      placedAt,
    ),
  ).toBe(2 * 498_747);
});

test("counts the shares of a stock that open sales set aside, and none of other stocks, of purchases, or of orders that are done", () => {
  expect(
    sharesSetAside(
      [
        order("sell", "BBCA", waiting),
        order("sell", "BBCA", resting),
        order("sell", "BBCA", expired),
        order("sell", "TLKM", waiting),
        order("buy", "BBCA", waiting),
      ],
      "BBCA",
      placedAt,
    ),
  ).toBe(200);
});

test("counts an order as open while it is waiting or resting, until its expiry", () => {
  expect(isOpenOrder(order("buy", "BBCA", waiting), lastMinuteOfDay)).toBe(
    true,
  );
  expect(isOpenOrder(order("buy", "BBCA", resting), lastMinuteOfDay)).toBe(
    true,
  );
  expect(isOpenOrder(order("buy", "BBCA", expired), placedAt)).toBe(false);
});

test("counts an order that is still waiting as closed from its expiry, so it sets aside nothing", () => {
  const purchase = order("buy", "BBCA", waiting);
  const sale = order("sell", "BBCA", waiting);
  expect(isOpenOrder(purchase, endOfDay)).toBe(false);
  expect(cashSetAside([purchase], endOfDay)).toBe(0);
  expect(sharesSetAside([sale], "BBCA", endOfDay)).toBe(0);
});
