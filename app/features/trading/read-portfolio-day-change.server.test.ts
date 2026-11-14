import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import type { Database } from "~/database/database.server";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { checkPortfolioOrders } from "./check-open-orders.server";
import {
  bbcaForTest,
  duringSessionForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import { readPortfolio } from "./portfolio-store.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import {
  placedOrderForTest,
  studentWithQuotesForTest,
  storeHoldingsForTest,
} from "./portfolios-for-test.server";
import { readPortfolioDayChange } from "./read-portfolio-day-change.server";
import { readPortfolioValuation } from "./read-portfolio-report.server";
import {
  recordedBbcaForTest,
  tradedPortfolioForTest,
} from "./traded-portfolio-for-test.server";
import { orders } from "./trading.schema";
import { purchasedPortfolioForTest } from "./purchased-portfolio-for-test.server";

// Python Decimal at 50 significant digits computed these comparisons from the recorded BBCA closes and the fills described by tradedPortfolioForTest. The previous close holds Rp250,600 and 20,000 shares at Rp4,980, or Rp99,850,600.
function dayChange(
  database: Database,
  owner: PortfolioOwner,
  now = new Date("2026-11-03T03:30:00Z"),
) {
  const portfolio = readPortfolio(database, owner);
  return readPortfolioDayChange(database, {
    portfolio,
    valuation: readPortfolioValuation(database, {
      portfolio,
      startingCash: owner.startingCash,
    }).valuation,
    now,
    delayMinutes: bbcaForTest.delayMinutes,
  });
}

test("includes sold shares, broker fees, and tax in the daily change", async () => {
  const { database, owner } = await tradedPortfolioForTest();
  saveDailyHistory(database, recordedBbcaForTest());
  expect(dayChange(database, owner)).toEqual({
    ok: true,
    value: {
      date: "2026-11-03",
      referenceDate: "2026-11-02",
      amount: -2_921_000,
      return: closeToForTest(-0.029253705035322774, 15),
    },
  });
  placedOrderForTest(
    database,
    owner,
    saleForTest({
      lots: orderLotsForTest(100),
      placedAt: new Date("2026-11-03T03:00:00Z"),
    }),
  );
  checkPortfolioOrders(
    database,
    owner.membershipId,
    new Date("2026-11-03T03:00:00Z"),
  );
  expect(readPortfolio(database, owner).holdings).toEqual([]);
  expect(dayChange(database, owner)).toMatchObject({
    ok: true,
    value: {
      amount: -3_042_000,
      return: closeToForTest(-0.03046551548012731, 15),
    },
  });
  expect(dayChange(database, owner, new Date("2026-11-07T03:00:00Z"))).toEqual({
    ok: true,
    value: {
      date: "2026-11-06",
      referenceDate: "2026-11-05",
      amount: 0,
      return: 0,
    },
  });
});

test("counts the purchase fee even when the share price has not moved", async () => {
  const { database, owner } = await purchasedPortfolioForTest();
  expect(dayChange(database, owner, duringSessionForTest)).toEqual({
    ok: true,
    value: {
      date: "2026-11-02",
      referenceDate: "2026-10-30",
      amount: -149_400,
      return: closeToForTest(-0.001494, 15),
    },
  });
});

test("requires the exact final close instead of using a live previous close", async () => {
  const { database, owner } = await tradedPortfolioForTest();
  saveDailyHistory(database, recordedBbcaForTest(["2026-11-02"]));
  expect(dayChange(database, owner)).toEqual({
    ok: false,
    failure: { kind: "missingCloses", date: "2026-11-02", codes: ["BBCA"] },
  });
  expect(dayChange(database, owner, new Date("2028-11-03T03:00:00Z"))).toEqual({
    ok: false,
    failure: { kind: "missingCalendar" },
  });
});

test("withholds the daily change while a current holding has no quote", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [],
    duringSessionForTest,
  );
  storeHoldingsForTest(database, owner, {
    cash: rupiah(48_529_600),
    holdings: [
      { code: "BBCA", shares: shares(10_000), cost: rupiah(49_874_700) },
    ],
  });
  expect(dayChange(database, owner)).toEqual({
    ok: false,
    failure: { kind: "unpriced" },
  });
});

test("withholds a percentage when deleted sale orders leave a nonpositive reference", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaForTest.quote],
    bbcaForTest.quote.quotedAt,
  );
  for (let count = 0; count < 70; count += 1) {
    placedOrderForTest(
      database,
      owner,
      purchaseForTest({ lots: orderLotsForTest(100) }),
    );
    checkPortfolioOrders(database, owner.membershipId, duringSessionForTest);
    placedOrderForTest(
      database,
      owner,
      saleForTest({ lots: orderLotsForTest(100) }),
    );
    checkPortfolioOrders(database, owner.membershipId, duringSessionForTest);
  }
  expect(
    database.delete(orders).where(eq(orders.side, "sell")).run().changes,
  ).toBe(70);
  saveDailyHistory(database, recordedBbcaForTest());
  // Decimal gives Rp100,000,000 less 70 purchases at Rp49,874,700 plus 700,000 shares at the recorded close of Rp4,840.
  expect(dayChange(database, owner, new Date("2026-11-04T03:00:00Z"))).toEqual({
    ok: false,
    failure: {
      kind: "nonPositiveReference",
      date: "2026-11-03",
      value: -3_229_000,
    },
  });
});
