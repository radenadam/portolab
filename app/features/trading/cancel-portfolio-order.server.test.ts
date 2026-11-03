import { expect, test } from "vitest";
import type { Database } from "~/database/database.server";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { successValueForTest } from "~/success-value-for-test";
import { parseRecordId } from "~/value-parsers";
import { cancelPortfolioOrder } from "./cancel-portfolio-order.server";
import { cashSetAside } from "./open-orders";
import {
  bbcaCloseOfFridayForTest,
  bbcaForTest,
  endOfMondayForTest,
  lastMinuteOfMondayForTest,
  purchaseForTest,
} from "./orders-for-test";
import {
  placedOrderForTest,
  studentPortfolioForTest,
  studentWithQuotesForTest,
} from "./portfolios-for-test.server";
import { readStoredPortfolio } from "./portfolio-store.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import type { OrderId } from "./trading.schema";

/** A purchase of 5 lots of BBCA at 10:00 WIB on Monday 2 November 2026 that waits, because the latest quote is the close of Friday, fetched at 08:40 WIB, which is from no session of Monday. */
async function waitingPurchaseForTest(): Promise<{
  database: Database;
  owner: PortfolioOwner;
  orderId: OrderId;
}> {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaCloseOfFridayForTest],
    new Date("2026-11-02T01:40:00Z"),
  );
  return {
    database,
    owner,
    orderId: placedOrderForTest(database, owner, purchaseForTest()),
  };
}

test("cancels an open order up to the last minute of its trading day, which returns the cash that it set aside", async () => {
  const { database, owner, orderId } = await waitingPurchaseForTest();
  const before = readStoredPortfolio(database, owner.membershipId);
  expect(cashSetAside(before?.orders ?? [], lastMinuteOfMondayForTest)).toEqual(
    {
      amount: 2_493_735,
      orders: 1,
    },
  );
  expect(
    cancelPortfolioOrder(
      database,
      { membershipId: owner.membershipId, orderId },
      lastMinuteOfMondayForTest,
    ),
  ).toEqual({ ok: true, value: undefined });
  const after = readStoredPortfolio(database, owner.membershipId);
  expect(after?.orders[0]?.state).toEqual({
    kind: "cancelled",
    cancelledAt: lastMinuteOfMondayForTest,
  });
  expect(cashSetAside(after?.orders ?? [], lastMinuteOfMondayForTest)).toEqual({
    amount: 0,
    orders: 0,
  });
});

test("cancels no order once it expired, and gives the order as it ended", async () => {
  const { database, owner, orderId } = await waitingPurchaseForTest();
  const cancelled = cancelPortfolioOrder(
    database,
    { membershipId: owner.membershipId, orderId },
    endOfMondayForTest,
  );
  expect(cancelled).toMatchObject({
    ok: false,
    failure: {
      kind: "ended",
      order: { id: orderId, state: { kind: "expired" } },
    },
  });
});

test("cancels no order that filled", async () => {
  const { database, owner, orderId } = await waitingPurchaseForTest();
  // Fetched at 09:51, the quote of 09:50 fills the purchase.
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaForTest.quote]),
    {
      at: new Date("2026-11-02T02:51:00Z"),
    },
  );
  expect(
    cancelPortfolioOrder(
      database,
      { membershipId: owner.membershipId, orderId },
      new Date("2026-11-02T02:52:00Z"),
    ),
  ).toMatchObject({
    ok: false,
    failure: { kind: "ended", order: { state: { kind: "filled" } } },
  });
});

test("cancels no order of another portfolio and no order that does not exist", async () => {
  const { database, orderId } = await waitingPurchaseForTest();
  const other = await studentPortfolioForTest(database, "mahasiswi");
  const unknownId = successValueForTest(
    parseRecordId<OrderId>(String(orderId + 1), "cancel"),
    "The number after the order is an id",
  );
  for (const missing of [orderId, unknownId]) {
    expect(
      cancelPortfolioOrder(
        database,
        { membershipId: other.membershipId, orderId: missing },
        lastMinuteOfMondayForTest,
      ),
    ).toEqual({ ok: false, failure: { kind: "missing" } });
  }
});
