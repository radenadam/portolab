import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { OrderState } from "./order";
import {
  acceptedForTest,
  accountForTest,
  bbcaForTest,
  duringSessionForTest,
  endOfMondayForTest,
  limitForTest,
  purchaseForTest,
} from "./orders-for-test";
import { studentPortfolioForTest } from "./portfolios-for-test.server";
import {
  listPortfoliosWithOpenOrders,
  readPortfolio,
  readStoredPortfolio,
  savePlacedOrder,
  saveOrderState,
} from "./portfolio-store.server";
import { orders } from "./trading.schema";

// The states of an order of 5 lots of BBCA that the store must give back as it stored them. The amounts are those of the check of orders in check-order.test.ts.
const quotedAt = new Date("2026-11-02T02:50:00Z");
const states: Record<string, OrderState> = {
  resting: { kind: "resting" },
  filled: {
    kind: "filled",
    fill: {
      price: rupiah(4_980),
      value: rupiah(2_490_000),
      fee: rupiah(3_735),
      tax: rupiah(0),
      cashChange: rupiah(-2_493_735),
      quotedAt,
      filledAt: duringSessionForTest,
    },
  },
  expired: { kind: "expired", expiredAt: endOfMondayForTest },
  priceRose: {
    kind: "rejected",
    rejectedAt: duringSessionForTest,
    quotedAt,
    failure: {
      kind: "priceRose",
      code: "BBCA",
      lots: lots(5),
      checkedPrice: rupiah(4_980),
      price: rupiah(5_025),
      value: rupiah(2_512_500),
      fee: rupiah(3_769),
      tax: rupiah(0),
      availableCash: rupiah(2_500_000),
    },
  },
  sharesGone: {
    kind: "rejected",
    rejectedAt: duringSessionForTest,
    quotedAt,
    failure: {
      kind: "sharesGone",
      code: "BBCA",
      lots: lots(5),
      heldLots: lots(2),
      setAside: { amount: lots(1), orders: 1 },
    },
  },
  cancelled: { kind: "cancelled", cancelledAt: duringSessionForTest },
};

test("gives a portfolio without an order the starting cash of its class and nothing else", async () => {
  const database = openDatabaseForTest();
  const owner = await studentPortfolioForTest(database);
  expect(readStoredPortfolio(database, owner.membershipId)).toBeUndefined();
  expect(readPortfolio(database, owner)).toEqual({
    cash: 100_000_000,
    holdings: [],
    orders: [],
  });
});

test("gives back an order as it stored it, with its limit, its reason or none, and each state that a check or the student gives it", async () => {
  const database = openDatabaseForTest();
  const owner = await studentPortfolioForTest(database);
  const reason = "Bank besar dengan laba stabil.\n\nBeta di bawah 1.";
  const order = acceptedForTest(
    purchaseForTest({ price: limitForTest(4_980), reason }),
    accountForTest(),
    bbcaForTest,
  );
  const orderId = savePlacedOrder(database, owner, order);
  const withoutReason = acceptedForTest(
    purchaseForTest(),
    accountForTest(),
    bbcaForTest,
  );
  const withoutReasonId = savePlacedOrder(database, owner, withoutReason);
  expect(order.reason).toBe(reason);
  expect(withoutReason.reason).toBeUndefined();
  expect(
    readStoredPortfolio(database, owner.membershipId)?.orders,
  ).toStrictEqual([
    { ...order, id: orderId },
    { ...withoutReason, id: withoutReasonId },
  ]);
  for (const [name, state] of Object.entries(states)) {
    saveOrderState(database, orderId, state);
    expect(
      readStoredPortfolio(database, owner.membershipId)?.orders[0]?.state,
      name,
    ).toEqual(state);
  }
});

test("lists the portfolios with an order that is waiting or resting", async () => {
  const database = openDatabaseForTest();
  const waiting = await studentPortfolioForTest(database);
  const resting = await studentPortfolioForTest(database, "mahasiswi");
  const done = await studentPortfolioForTest(database, "mahasiswa.lain");
  const order = acceptedForTest(
    purchaseForTest(),
    accountForTest(),
    bbcaForTest,
  );
  savePlacedOrder(database, waiting, order);
  saveOrderState(
    database,
    savePlacedOrder(database, resting, order),
    states["resting"] ?? order.state,
  );
  saveOrderState(database, savePlacedOrder(database, done, order), {
    kind: "cancelled",
    cancelledAt: duringSessionForTest,
  });
  expect(listPortfoliosWithOpenOrders(database)).toEqual([
    waiting.membershipId,
    resting.membershipId,
  ]);
});

test("fails with the order and the column when a column that its state needs is empty, which no code writes", async () => {
  const database = openDatabaseForTest();
  const owner = await studentPortfolioForTest(database);
  const order = acceptedForTest(
    purchaseForTest(),
    accountForTest(),
    bbcaForTest,
  );
  const orderId = savePlacedOrder(database, owner, order);
  database
    .update(orders)
    .set({ state: "expired" })
    .where(eq(orders.id, orderId))
    .run();
  expect(() => readStoredPortfolio(database, owner.membershipId)).toThrow(
    `The order ${String(orderId)} is expired, but its column endedAt is empty.`,
  );
});
