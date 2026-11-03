import { expect, test } from "vitest";
import { stockQuote } from "~/features/market-data/stock-quote";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { checkOrder } from "./check-order";
import { hasOpenState } from "./open-orders";
import type { OpenOrder, Order, OrderRequest } from "./order";
import {
  acceptedForTest,
  accountForTest,
  bbcaCloseOfFridayForTest,
  bbcaForTest,
  limitForTest,
  orderLotsForTest,
  purchaseForTest,
} from "./orders-for-test";

// The money in the expected fills was computed with the decimal module of Python, with a broker fee of 0.15% and a tax of 0.1% of the value, each rounded to a whole rupiah with ROUND_HALF_UP. The comment of each moment gives the time in WIB on Monday 2 November 2026, unless it names another day.

// 09:50.
const latestAtTen = bbcaForTest.quote;
// The close of Friday, which every quote of Monday states as its previous close.
const closeOfFridayPrice = bbcaCloseOfFridayForTest.price;

function placed(
  changes: Partial<OrderRequest>,
  latest: StockQuote = latestAtTen,
): OpenOrder {
  return acceptedForTest(
    purchaseForTest(changes),
    accountForTest({
      holdings: [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }],
    }),
    { ...bbcaForTest, quote: latest },
  );
}

/** An order of the test in the state resting, as a check leaves an order whose first price does not reach its limit. */
function resting(changes: Partial<OrderRequest>): OpenOrder {
  return { ...placed(changes), state: { kind: "resting" } };
}

/** A limit purchase of 10 lots at Rp4,950, below the latest price of Rp4,980. */
const restingPurchase = resting({
  lots: orderLotsForTest(10),
  price: limitForTest(4_950),
});

/** An order as the check job selects it from the orders of an account, which every check of these tests receives. */
function selectedForCheck(order: Order): OpenOrder {
  if (!hasOpenState(order)) {
    throw new Error(
      `The test expects an order that is waiting or resting, but it is ${order.state.kind}.`,
    );
  }
  return order;
}

/** The state of an order after a check at a moment, with the cash and the shares of BBCA that the other open orders of the account leave, which are Rp100 million and the 500 shares of the account of placed unless the test gives others. */
function checkedWith(
  order: Order,
  latest: StockQuote | undefined,
  at: { moment: string; availableCash?: number; availableShares?: number },
): Order["state"] {
  return checkOrder({
    order: selectedForCheck(order),
    quote: latest,
    moment: new Date(at.moment),
    availableCash: rupiah(at.availableCash ?? 100_000_000),
    availableShares: shares(at.availableShares ?? 500),
  });
}

function checked(
  order: Order,
  latest: StockQuote,
  moment: string,
): Order["state"] {
  return checkedWith(order, latest, { moment });
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
    bbcaCloseOfFridayForTest,
  );
  expect(
    checked(order, bbcaCloseOfFridayForTest, "2026-11-02T02:05:00Z"),
  ).toEqual({
    kind: "waiting",
  });
  // Quoted at 09:00:30 and checked at 09:10, with a fee of Rp3,742.50 that rounds up.
  const firstOfSession = stockQuote(
    "BBCA",
    [4_990, closeOfFridayPrice],
    "2026-11-02T02:00:30Z",
  );
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
  const endOfSessionI = stockQuote(
    "BBCA",
    [4_980, closeOfFridayPrice],
    "2026-11-02T04:59:00Z",
  );
  const order = placed(
    { placedAt: new Date("2026-11-02T05:30:00Z") },
    endOfSessionI,
  );
  expect(checked(order, endOfSessionI, "2026-11-02T06:35:00Z")).toEqual({
    kind: "waiting",
  });
  const sessionII = stockQuote(
    "BBCA",
    [4_970, closeOfFridayPrice],
    "2026-11-02T06:31:00Z",
  );
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
  // Quoted at 10:20 and checked at 10:30.
  const above = stockQuote(
    "BBCA",
    [4_960, closeOfFridayPrice],
    "2026-11-02T03:20:00Z",
  );
  expect(checked(restingPurchase, above, "2026-11-02T03:30:00Z")).toEqual({
    kind: "resting",
  });
  const below = stockQuote(
    "BBCA",
    [4_940, closeOfFridayPrice],
    "2026-11-02T03:21:00Z",
  );
  expect(checked(restingPurchase, below, "2026-11-02T03:31:00Z")).toEqual({
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
  const order = resting({ side: "sell", price: limitForTest(5_050) });
  const above = stockQuote(
    "BBCA",
    [5_075, closeOfFridayPrice],
    "2026-11-02T03:20:00Z",
  );
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
  const order = restingPurchase;
  // Quoted at 15:45, in session II, and checked at 15:55, after it.
  const lastOfSession = stockQuote(
    "BBCA",
    [4_940, closeOfFridayPrice],
    "2026-11-02T08:45:00Z",
  );
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
  const order = restingPurchase;
  // Quoted at 15:55, in the pre-closing session.
  const preClosing = stockQuote(
    "BBCA",
    [4_900, closeOfFridayPrice],
    "2026-11-02T08:55:00Z",
  );
  expect(checked(order, preClosing, "2026-11-02T09:05:00Z")).toEqual({
    kind: "resting",
  });
});

test("expires an order that has not filled once the prices of its trading day are final, when isOpenOrder no longer counts it as open", () => {
  const order = restingPurchase;
  const lastOfDay = stockQuote(
    "BBCA",
    [4_990, closeOfFridayPrice],
    "2026-11-02T08:49:00Z",
  );
  // 16:25 is the last minute of the price hours of a source with this delay.
  expect(checked(order, lastOfDay, "2026-11-02T09:25:00Z")).toEqual({
    kind: "resting",
  });
  expect(checked(order, lastOfDay, "2026-11-02T09:26:00Z")).toEqual({
    kind: "expired",
    expiredAt: new Date("2026-11-02T09:26:00Z"),
  });
});

test("rejects a market purchase whose price rose beyond the cash while it waited, with the price that it was checked at and the cost at the new price", () => {
  // Placed at 20:00 at the close of Rp4,980, which sets aside Rp9,974,940, and checked at 09:10 on Tuesday 3 November 2026 against a price of Rp5,025 that costs Rp10,065,075.
  const closeOfMonday = stockQuote(
    "BBCA",
    [4_980, closeOfFridayPrice],
    "2026-11-02T09:14:55Z",
  );
  const order = placed(
    { lots: orderLotsForTest(20), placedAt: new Date("2026-11-02T13:00:00Z") },
    closeOfMonday,
  );
  expect(order.setAsideCash).toBe(9_974_940);
  const firstOfTuesday = stockQuote(
    "BBCA",
    [5_025, closeOfMonday.price],
    "2026-11-03T02:00:30Z",
  );
  expect(
    checkedWith(order, firstOfTuesday, {
      moment: "2026-11-03T02:10:00Z",
      availableCash: 10_000_000,
    }),
  ).toEqual({
    kind: "rejected",
    rejectedAt: new Date("2026-11-03T02:10:00Z"),
    quotedAt: firstOfTuesday.quotedAt,
    failure: {
      kind: "priceRose",
      code: "BBCA",
      lots: 20,
      checkedPrice: 4_980,
      price: 5_025,
      value: 10_050_000,
      fee: 15_075,
      tax: 0,
      availableCash: 10_000_000,
    },
  });
});

test("keeps an order placed on a weekend waiting until a price of the next trading day", () => {
  // Placed at 10:00 WIB on Saturday 7 November 2026, when the latest quote is the close of Friday 6 November at the price of Thursday, and checked on Sunday 8 November.
  const closeOfFridaySixNovember = stockQuote(
    "BBCA",
    [4_980, 4_980],
    "2026-11-06T09:14:55Z",
  );
  const order = placed(
    { placedAt: new Date("2026-11-07T03:00:00Z") },
    closeOfFridaySixNovember,
  );
  expect(order.tradingDay).toBe("2026-11-09");
  expect(
    checked(order, closeOfFridaySixNovember, "2026-11-08T03:00:00Z"),
  ).toEqual({
    kind: "waiting",
  });
});

test("keeps an order waiting through holidays until the next trading day", () => {
  // Placed at 16:00 WIB on Wednesday 23 December 2026, when the latest delayed price is from 15:49 at the price of Tuesday, and checked at 10:00 WIB on Thursday 24 December, a holiday.
  const lastOfWednesday = stockQuote(
    "BBCA",
    [4_980, 4_980],
    "2026-12-23T08:49:00Z",
  );
  const order = placed(
    { placedAt: new Date("2026-12-23T09:00:00Z") },
    lastOfWednesday,
  );
  expect(order.tradingDay).toBe("2026-12-28");
  expect(checked(order, lastOfWednesday, "2026-12-24T03:00:00Z")).toEqual({
    kind: "waiting",
  });
});

test("expires an order at its expiry even when a price of its sessions that a check reaches late would fill it", () => {
  const order = restingPurchase;
  // Quoted at 15:40 below the limit, but checked only at 16:30.
  const lateQuote = stockQuote(
    "BBCA",
    [4_900, closeOfFridayPrice],
    "2026-11-02T08:40:00Z",
  );
  expect(checked(order, lateQuote, "2026-11-02T09:30:00Z")).toEqual({
    kind: "expired",
    expiredAt: new Date("2026-11-02T09:30:00Z"),
  });
});

test("keeps an order open without a quote that a check may fill it with, and expires it once the prices of its trading day are final", () => {
  const order = restingPurchase;
  expect(
    checkedWith(order, undefined, { moment: "2026-11-02T09:25:00Z" }),
  ).toEqual({ kind: "resting" });
  expect(
    checkedWith(order, undefined, { moment: "2026-11-02T09:26:00Z" }),
  ).toEqual({
    kind: "expired",
    expiredAt: new Date("2026-11-02T09:26:00Z"),
  });
});

test("rejects a sale whose holding no longer has the shares that it set aside when a price reaches it, with the lots that remain beyond other open sales", () => {
  const order = placed({ side: "sell" });
  // Of the 500 shares that the sale set aside, a deletion by hand left 250 that no other open sale sets aside, which are 2 whole lots.
  expect(
    checkedWith(order, latestAtTen, {
      moment: "2026-11-02T03:00:00Z",
      availableShares: 250,
    }),
  ).toEqual({
    kind: "rejected",
    rejectedAt: new Date("2026-11-02T03:00:00Z"),
    quotedAt: latestAtTen.quotedAt,
    failure: {
      kind: "sharesGone",
      code: "BBCA",
      lots: 5,
      availableLots: 2,
    },
  });
  expect(
    checkedWith(order, latestAtTen, {
      moment: "2026-11-02T03:00:00Z",
      availableShares: 500,
    }),
  ).toMatchObject({ kind: "filled" });
});
