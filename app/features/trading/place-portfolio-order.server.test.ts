import { expect, test } from "vitest";
import { placePortfolioOrder } from "./place-portfolio-order.server";
import {
  bbcaCloseOfFridayForTest,
  bbcaForTest,
  duringSessionForTest,
  lastMinuteOfMondayForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import {
  placedOrderForTest,
  studentWithQuotesForTest,
} from "./portfolios-for-test.server";
import { readStoredPortfolio } from "./portfolio-store.server";
import { rupiah } from "~/units/rupiah";

// The amounts that a purchase sets aside were computed with the decimal module of Python, with a broker fee of 0.15% of the value rounded to a whole rupiah with ROUND_HALF_UP.

// 08:40 WIB on Monday 2 November 2026, before the market opens, when an update fetches the close of Friday. That quote is from no session of Monday, so a purchase of Monday waits.
const beforeOpen = new Date("2026-11-02T01:40:00Z");

// Python Decimal gives 2493735 for five lots at 4980 with the 0.15% fee rounded half up.
test("requires the shown total for placement and saves nothing for a missing or changed preview", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaCloseOfFridayForTest],
    beforeOpen,
  );
  for (const seenTotal of [null, rupiah(2_493_734), rupiah(2_493_736)]) {
    expect(
      placePortfolioOrder(database, purchaseForTest(), {
        owner,
        delayMinutes: bbcaForTest.delayMinutes,
        seenTotal,
      }),
    ).toEqual({ ok: false, failure: { kind: "previewChanged" } });
    expect(readStoredPortfolio(database, owner.membershipId)).toBeUndefined();
  }
  expect(
    placePortfolioOrder(database, purchaseForTest(), {
      owner,
      delayMinutes: bbcaForTest.delayMinutes,
      seenTotal: rupiah(2_493_735),
    }),
  ).toMatchObject({ ok: true });
  expect(
    readStoredPortfolio(database, owner.membershipId)?.orders,
  ).toHaveLength(1);
});

test("stores the first order that Portolab accepts with a portfolio that holds the starting cash of the class, and stores nothing for an order that it rejects", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaCloseOfFridayForTest],
    beforeOpen,
  );
  expect(
    placePortfolioOrder(database, saleForTest(), {
      owner,
      delayMinutes: bbcaForTest.delayMinutes,
      seenTotal: null,
    }),
  ).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      code: "BBCA",
      lots: 5,
      heldLots: 0,
      setAside: { amount: 0, orders: 0 },
    },
  });
  expect(readStoredPortfolio(database, owner.membershipId)).toBeUndefined();
  const orderId = placedOrderForTest(database, owner, purchaseForTest());
  // The quote of Friday is from no session of Monday, so the order waits.
  expect(readStoredPortfolio(database, owner.membershipId)).toEqual({
    cash: 100_000_000,
    holdings: [],
    orders: [
      expect.objectContaining({
        id: orderId,
        placedAt: duringSessionForTest,
        tradingDay: "2026-11-02",
        setAsideCash: 2_493_735,
        state: { kind: "waiting" },
      }),
    ],
  });
});

test("marks an order of an earlier trading day expired before it checks a new order, which the cash that the expired order set aside pays for", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaCloseOfFridayForTest],
    beforeOpen,
  );
  // 190 lots at Rp4,980 set aside Rp94,761,930 of the cash of Rp100 million, so a second such purchase fits only once the first ends.
  const lots = orderLotsForTest(190);
  placedOrderForTest(database, owner, purchaseForTest({ lots }));
  expect(
    placePortfolioOrder(
      database,
      purchaseForTest({ lots, placedAt: lastMinuteOfMondayForTest }),
      { owner, delayMinutes: bbcaForTest.delayMinutes, seenTotal: null },
    ),
  ).toMatchObject({ ok: false, failure: { kind: "notEnoughCash" } });
  // 10:00 WIB on Tuesday 3 November 2026.
  const tuesday = new Date("2026-11-03T03:00:00Z");
  placedOrderForTest(
    database,
    owner,
    purchaseForTest({ lots, placedAt: tuesday }),
  );
  expect(readStoredPortfolio(database, owner.membershipId)).toMatchObject({
    orders: [
      {
        setAsideCash: 94_761_930,
        state: { kind: "expired", expiredAt: tuesday },
      },
      { setAsideCash: 94_761_930, state: { kind: "waiting" } },
    ],
  });
});
