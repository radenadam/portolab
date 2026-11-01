import { expect, test } from "vitest";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { checkOrder } from "./check-order";
import type { OpenOrder, Order, OrderRequest } from "./order";
import {
  acceptedForTest,
  limitForTest,
  orderLotsForTest,
  quoteForTest,
} from "./orders-for-test";

// The money in the expected fills was computed with the decimal module of Python, with a broker fee of 0.15% and a tax of 0.1% of the value, each rounded to a whole rupiah with ROUND_HALF_UP. The comment of each moment gives the time in WIB on Monday 2 November 2026, unless it names another day.

// 09:50.
const latestAtTen = quoteForTest("BBCA", 4_980, "2026-11-02T02:50:00Z");
// 16:14 on Friday 30 October 2026.
const closeOfFriday = quoteForTest("BBCA", 4_940, "2026-10-30T09:14:55Z");

function placed(
  changes: Partial<OrderRequest>,
  latest: StockQuote = latestAtTen,
): OpenOrder {
  return acceptedForTest(
    {
      code: "BBCA",
      side: "buy",
      lots: orderLotsForTest(5),
      price: { kind: "market" },
      // 10:00.
      placedAt: new Date("2026-11-02T03:00:00Z"),
      ...changes,
    },
    {
      cash: rupiah(100_000_000),
      holdings: [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }],
      orders: [],
    },
    {
      quote: latest,
      // A source that lags 10 minutes behind the exchange, so the prices of a day are final from 16:26.
      delayMinutes: 10,
      closes: monthEndClosesForTest("BBCA"),
      marketCloses: monthEndClosesForTest("IHSG"),
    },
  );
}

function checked(
  order: OpenOrder,
  latest: StockQuote,
  moment: string,
): Order["state"] {
  return checkOrder({
    order,
    quote: latest,
    moment: new Date(moment),
    availableCash: rupiah(100_000_000),
  });
}

test("fills a market purchase placed during a session at once, at the latest delayed price", () => {
  const order = placed({});
  expect(checked(order, latestAtTen, "2026-11-02T03:00:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 4_980,
      value: 2_490_000,
      fee: 3_735,
      tax: 0,
      cashChange: -2_493_735,
      quotedAt: latestAtTen.quotedAt,
      filledAt: new Date("2026-11-02T03:00:00Z"),
    },
  });
});

test("fills a market sale at once, and pays the value less the fee and the tax", () => {
  const order = placed({ side: "sell" });
  expect(checked(order, latestAtTen, "2026-11-02T03:00:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 4_980,
      value: 2_490_000,
      fee: 3_735,
      tax: 2_490,
      cashChange: 2_483_775,
      quotedAt: latestAtTen.quotedAt,
      filledAt: new Date("2026-11-02T03:00:00Z"),
    },
  });
});

test("keeps an order placed before the market opens waiting while the latest price is from an earlier day, and fills it at the first price of the session", () => {
  // 08:50, when the latest quote is the close of Friday.
  const order = placed(
    { placedAt: new Date("2026-11-02T01:50:00Z") },
    closeOfFriday,
  );
  expect(checked(order, closeOfFriday, "2026-11-02T02:05:00Z")).toEqual({
    kind: "waiting",
  });
  // Quoted at 09:00:30 and checked at 09:10, with a fee of Rp3,742.50 that rounds up.
  const firstOfSession = quoteForTest("BBCA", 4_990, "2026-11-02T02:00:30Z");
  expect(checked(order, firstOfSession, "2026-11-02T02:10:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 4_990,
      value: 2_495_000,
      fee: 3_743,
      tax: 0,
      cashChange: -2_498_743,
      quotedAt: firstOfSession.quotedAt,
      filledAt: new Date("2026-11-02T02:10:00Z"),
    },
  });
});

test("keeps an order placed in the break waiting for a price of session II", () => {
  // Placed at 12:30, when the latest quote is from 11:59.
  const endOfSessionI = quoteForTest("BBCA", 4_980, "2026-11-02T04:59:00Z");
  const order = placed(
    { placedAt: new Date("2026-11-02T05:30:00Z") },
    endOfSessionI,
  );
  expect(checked(order, endOfSessionI, "2026-11-02T06:35:00Z")).toEqual({
    kind: "waiting",
  });
  const sessionII = quoteForTest("BBCA", 4_970, "2026-11-02T06:31:00Z");
  expect(checked(order, sessionII, "2026-11-02T06:41:00Z")).toMatchObject({
    kind: "filled",
    fill: { price: 4_970 },
  });
});

test("fills a limit purchase that arrives at a price below its limit at that price", () => {
  const order = placed({
    lots: orderLotsForTest(10),
    price: limitForTest(5_000),
  });
  expect(checked(order, latestAtTen, "2026-11-02T03:00:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 4_980,
      value: 4_980_000,
      fee: 7_470,
      tax: 0,
      cashChange: -4_987_470,
      quotedAt: latestAtTen.quotedAt,
      filledAt: new Date("2026-11-02T03:00:00Z"),
    },
  });
});

test("rests a limit purchase whose first price is above its limit, and fills it at its limit when a later price falls through it", () => {
  const order = placed({
    lots: orderLotsForTest(10),
    price: limitForTest(4_950),
  });
  expect(checked(order, latestAtTen, "2026-11-02T03:00:00Z")).toEqual({
    kind: "resting",
  });
  const resting: OpenOrder = { ...order, state: { kind: "resting" } };
  // Quoted at 10:20 and checked at 10:30.
  const above = quoteForTest("BBCA", 4_960, "2026-11-02T03:20:00Z");
  expect(checked(resting, above, "2026-11-02T03:30:00Z")).toEqual({
    kind: "resting",
  });
  const below = quoteForTest("BBCA", 4_940, "2026-11-02T03:21:00Z");
  expect(checked(resting, below, "2026-11-02T03:31:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 4_950,
      value: 4_950_000,
      fee: 7_425,
      tax: 0,
      cashChange: -4_957_425,
      quotedAt: below.quotedAt,
      filledAt: new Date("2026-11-02T03:31:00Z"),
    },
  });
});

test("fills a resting limit sale at its limit when a later price rises through it", () => {
  const order: OpenOrder = {
    ...placed({ side: "sell", price: limitForTest(5_050) }),
    state: { kind: "resting" },
  };
  const above = quoteForTest("BBCA", 5_075, "2026-11-02T03:20:00Z");
  expect(checked(order, above, "2026-11-02T03:30:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 5_050,
      value: 2_525_000,
      fee: 3_788,
      tax: 2_525,
      cashChange: 2_518_687,
      quotedAt: above.quotedAt,
      filledAt: new Date("2026-11-02T03:30:00Z"),
    },
  });
});

test("fills a resting order with a price of session II that arrives after the session ends", () => {
  const order: OpenOrder = {
    ...placed({ lots: orderLotsForTest(10), price: limitForTest(4_950) }),
    state: { kind: "resting" },
  };
  // Quoted at 15:45, in session II, and checked at 15:55, after it.
  const lastOfSession = quoteForTest("BBCA", 4_940, "2026-11-02T08:45:00Z");
  expect(checked(order, lastOfSession, "2026-11-02T08:55:00Z")).toEqual({
    kind: "filled",
    fill: {
      price: 4_950,
      value: 4_950_000,
      fee: 7_425,
      tax: 0,
      cashChange: -4_957_425,
      quotedAt: lastOfSession.quotedAt,
      filledAt: new Date("2026-11-02T08:55:00Z"),
    },
  });
});

test("fills no order with a price quoted after session II", () => {
  const order: OpenOrder = {
    ...placed({ lots: orderLotsForTest(10), price: limitForTest(4_950) }),
    state: { kind: "resting" },
  };
  // Quoted at 15:55, in the pre-closing session.
  const preClosing = quoteForTest("BBCA", 4_900, "2026-11-02T08:55:00Z");
  expect(checked(order, preClosing, "2026-11-02T09:05:00Z")).toEqual({
    kind: "resting",
  });
});

test("expires an order that has not filled once the prices of its trading day are final", () => {
  const order: OpenOrder = {
    ...placed({ lots: orderLotsForTest(10), price: limitForTest(4_950) }),
    state: { kind: "resting" },
  };
  const lastOfDay = quoteForTest("BBCA", 4_990, "2026-11-02T08:49:00Z");
  // 16:25 is the last minute of the price hours of a source with this delay.
  expect(checked(order, lastOfDay, "2026-11-02T09:25:00Z")).toEqual({
    kind: "resting",
  });
  expect(checked(order, lastOfDay, "2026-11-02T09:26:00Z")).toEqual({
    kind: "expired",
    expiredAt: new Date("2026-11-02T09:26:00Z"),
  });
});

test("rejects a market purchase whose price rose beyond the cash while it waited, and gives the largest that the cash pays for", () => {
  // Placed at 20:00 at the close of Rp4,980, which sets aside Rp9,974,940, and checked at 09:10 on Tuesday 3 November 2026 against a price of Rp5,025 that costs Rp10,065,075.
  const closeOfMonday = quoteForTest("BBCA", 4_980, "2026-11-02T09:14:55Z");
  const order = placed(
    { lots: orderLotsForTest(20), placedAt: new Date("2026-11-02T13:00:00Z") },
    closeOfMonday,
  );
  expect(order.setAsideCash).toBe(9_974_940);
  const firstOfTuesday = quoteForTest("BBCA", 5_025, "2026-11-03T02:00:30Z");
  expect(
    checkOrder({
      order,
      quote: firstOfTuesday,
      moment: new Date("2026-11-03T02:10:00Z"),
      availableCash: rupiah(10_000_000),
    }),
  ).toEqual({
    kind: "rejected",
    rejectedAt: new Date("2026-11-03T02:10:00Z"),
    failure: {
      kind: "priceRose",
      code: "BBCA",
      lots: 20,
      checkedPrice: 4_980,
      price: 5_025,
      value: 10_050_000,
      fee: 15_075,
      availableCash: 10_000_000,
      largestLots: 19,
    },
  });
});

test("keeps an order placed on a weekend waiting until a price of the next trading day", () => {
  // Placed at 10:00 WIB on Saturday 7 November 2026, when the latest quote is the close of Friday 6 November, and checked on Sunday 8 November.
  const closeOfFriday = quoteForTest("BBCA", 4_980, "2026-11-06T09:14:55Z");
  const order = placed(
    { placedAt: new Date("2026-11-07T03:00:00Z") },
    closeOfFriday,
  );
  expect(order.tradingDay).toBe("2026-11-09");
  expect(checked(order, closeOfFriday, "2026-11-08T03:00:00Z")).toEqual({
    kind: "waiting",
  });
});

test("keeps an order waiting through holidays until the next trading day", () => {
  // Placed at 16:00 WIB on Wednesday 23 December 2026, and checked at 10:00 WIB on Thursday 24 December, a holiday.
  const closeOfWednesday = quoteForTest("BBCA", 4_980, "2026-12-23T09:14:55Z");
  const order = placed(
    { placedAt: new Date("2026-12-23T09:00:00Z") },
    closeOfWednesday,
  );
  expect(order.tradingDay).toBe("2026-12-28");
  expect(checked(order, closeOfWednesday, "2026-12-24T03:00:00Z")).toEqual({
    kind: "waiting",
  });
});

test("expires an order at its expiry even when a price of its sessions that a check reaches late would fill it", () => {
  const order: OpenOrder = {
    ...placed({ lots: orderLotsForTest(10), price: limitForTest(4_950) }),
    state: { kind: "resting" },
  };
  // Quoted at 15:40 below the limit, but checked only at 16:30.
  const lateQuote = quoteForTest("BBCA", 4_900, "2026-11-02T08:40:00Z");
  expect(checked(order, lateQuote, "2026-11-02T09:30:00Z")).toEqual({
    kind: "expired",
    expiredAt: new Date("2026-11-02T09:30:00Z"),
  });
});
