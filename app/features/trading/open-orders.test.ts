import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Order, OrderSide, OrderState } from "./order";
import {
  duringSessionForTest,
  endOfMondayForTest,
  lastMinuteOfMondayForTest,
  orderLotsForTest,
} from "./orders-for-test";
import {
  cashSetAside,
  hasOpenState,
  holdsFreeShares,
  isOpenOrder,
  openSales,
  sharesSetAside,
} from "./open-orders";

// The comment of each moment gives the time in WIB on Monday 2 November 2026. The amount that a purchase sets aside was computed with the decimal module of Python, with a broker fee of 0.15% of the value rounded to a whole rupiah with ROUND_HALF_UP.

const placedAt = duringSessionForTest;
const lastMinuteOfDay = lastMinuteOfMondayForTest;
const endOfDay = endOfMondayForTest;

// Each order is a limit order of 1 lot that stays open beside the price of Rp4,980, as a purchase at Rp4,950 or a sale at Rp5,050. Only a purchase sets aside cash, and 1 lot at Rp4,950 with its fee sets aside Rp495,743, so two such purchases set aside Rp991,486.
const limits: Record<OrderSide, { limit: Rupiah; setAsideCash: Rupiah }> = {
  buy: { limit: rupiah(4_950), setAsideCash: rupiah(495_743) },
  sell: { limit: rupiah(5_050), setAsideCash: rupiah(0) },
};

function order(side: OrderSide, code: string, state: OrderState): Order {
  const { limit, setAsideCash } = limits[side];
  return {
    code,
    side,
    lots: orderLotsForTest(1),
    price: { kind: "limit", limit },
    reason: undefined,
    placedAt,
    shares: shares(100),
    tradingDay: "2026-11-02",
    tradesFrom: new Date("2026-11-02T02:00:00Z"),
    expiresAt: endOfDay,
    checkedPrice: limit,
    setAsideCash,
    state,
  };
}

const waiting: OrderState = { kind: "waiting" };
const resting: OrderState = { kind: "resting" };
// 10:30, when the student cancelled an order of the day.
const cancelled: OrderState = {
  kind: "cancelled",
  cancelledAt: new Date("2026-11-02T03:30:00Z"),
};
// 16:26 on Friday 30 October 2026, when the open orders of that day expired.
const endOfFriday = new Date("2026-10-30T09:26:00Z");

/** An order placed at 10:00 on Friday 30 October 2026 that a check marked expired at the end of that day. */
function expiredOrder(side: OrderSide, code: string): Order {
  return {
    ...order(side, code, { kind: "expired", expiredAt: endOfFriday }),
    placedAt: new Date("2026-10-30T03:00:00Z"),
    tradingDay: "2026-10-30",
    tradesFrom: new Date("2026-10-30T02:00:00Z"),
    expiresAt: endOfFriday,
  };
}

test("counts the cash that open purchases set aside, and none of orders that are done or of sales", () => {
  expect(
    cashSetAside(
      [
        order("buy", "BBCA", waiting),
        order("buy", "TLKM", resting),
        expiredOrder("buy", "BBCA"),
        order("buy", "ASII", cancelled),
        order("sell", "BBCA", waiting),
      ],
      lastMinuteOfDay,
    ),
  ).toEqual({ amount: 991_486, orders: 2 });
});

test("counts the shares of a stock that open sales set aside, and none of other stocks, of purchases, or of orders that are done", () => {
  expect(
    sharesSetAside(
      [
        order("sell", "BBCA", waiting),
        order("sell", "BBCA", resting),
        expiredOrder("sell", "BBCA"),
        order("sell", "BBCA", cancelled),
        order("sell", "TLKM", waiting),
        order("buy", "BBCA", waiting),
      ],
      "BBCA",
      placedAt,
    ),
  ).toEqual({ amount: 200, orders: 2 });
});

test("counts an order as open while it is waiting or resting, until its expiry", () => {
  expect(isOpenOrder(order("buy", "BBCA", waiting), lastMinuteOfDay)).toBe(
    true,
  );
  expect(isOpenOrder(order("buy", "BBCA", resting), lastMinuteOfDay)).toBe(
    true,
  );
  expect(isOpenOrder(expiredOrder("buy", "BBCA"), placedAt)).toBe(false);
});

test("counts an order that is still waiting as closed from its expiry, so it sets aside nothing", () => {
  const purchase = order("buy", "BBCA", waiting);
  const sale = order("sell", "BBCA", waiting);
  expect(isOpenOrder(purchase, endOfDay)).toBe(false);
  expect(cashSetAside([purchase], endOfDay)).toEqual({ amount: 0, orders: 0 });
  expect(sharesSetAside([sale], "BBCA", endOfDay)).toEqual({
    amount: 0,
    orders: 0,
  });
});

test("selects an order that is waiting or resting for the check also after its expiry, so the check can mark it expired", () => {
  const purchase = order("buy", "BBCA", waiting);
  expect(hasOpenState(purchase)).toBe(true);
  expect(hasOpenState(order("buy", "BBCA", resting))).toBe(true);
  expect(isOpenOrder(purchase, endOfDay)).toBe(false);
  expect(hasOpenState(expiredOrder("buy", "BBCA"))).toBe(false);
  expect(hasOpenState(order("buy", "BBCA", cancelled))).toBe(false);
});

test("finds free shares only in a holding that open sell orders do not set aside completely", () => {
  const holdings = [{ code: "BBCA", shares: shares(100), cost: rupiah(0) }];
  const sale = order("sell", "BBCA", waiting);
  expect(holdsFreeShares({ holdings, orders: [sale] }, placedAt)).toBe(false);
  expect(holdsFreeShares({ holdings, orders: [] }, placedAt)).toBe(true);
  expect(holdsFreeShares({ holdings, orders: [sale] }, endOfDay)).toBe(true);
  expect(holdsFreeShares({ holdings: [], orders: [] }, placedAt)).toBe(false);
});

test("lists each stock of the open sell orders once and counts the orders, and none of purchases or of orders that are done", () => {
  expect(
    openSales(
      [
        order("sell", "TLKM", waiting),
        order("sell", "BBCA", resting),
        order("sell", "BBCA", waiting),
        expiredOrder("sell", "ASII"),
        order("buy", "BMRI", waiting),
      ],
      placedAt,
    ),
  ).toEqual({ codes: ["BBCA", "TLKM"], orders: 3 });
  expect(openSales([order("sell", "BBCA", waiting)], endOfDay)).toEqual({
    codes: [],
    orders: 0,
  });
});
