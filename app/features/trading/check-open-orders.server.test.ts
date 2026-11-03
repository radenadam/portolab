import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  failingSourceForTest,
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { findStockQuote } from "~/features/market-data/quote-store.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { readLatestUpdateAttempt } from "~/features/market-data/update-attempts.server";
import { checkAllOpenOrders } from "./check-open-orders.server";
import {
  bbcaCloseOfFridayForTest,
  bbcaForTest,
  duringSessionForTest,
  endOfMondayForTest,
  limitForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import {
  placedOrderForTest,
  storeBbcaHistoryForTest,
  studentPortfolioForTest,
  studentWithQuotesForTest,
} from "./portfolios-for-test.server";
import { readStoredPortfolio } from "./portfolio-store.server";
import { holdings } from "./trading.schema";

// The money of each fill was computed with the decimal module of Python, with a broker fee of 0.15% and a tax of 0.1% of the value, each rounded to a whole rupiah with ROUND_HALF_UP. The comment of each moment gives the time in WIB on Monday 2 November 2026.

// 09:50, with the close of Friday as its previous close.
const atTen = bbcaForTest.quote;
// The close of TLKM of Friday, which an update of the tests fetches when it fails to fetch BBCA.
const tlkmOfFriday = stockQuote("TLKM", [1_980, 1_980], "2026-10-30T09:14:51Z");

test("fills a market purchase at once with a quote of its session that the latest update fetched, and pays its cost from the cash into a new holding", async () => {
  // Fetched at 09:51.
  const { database, owner } = await studentWithQuotesForTest(
    [atTen],
    new Date("2026-11-02T02:51:00Z"),
  );
  const orderId = placedOrderForTest(database, owner, purchaseForTest());
  expect(readStoredPortfolio(database, owner.membershipId)).toEqual({
    cash: 97_506_265,
    holdings: [{ code: "BBCA", shares: 500, cost: 2_493_735 }],
    orders: [
      expect.objectContaining({
        id: orderId,
        state: {
          kind: "filled",
          fill: {
            price: 4_980,
            value: 2_490_000,
            fee: 3_735,
            tax: 0,
            cashChange: -2_493_735,
            quotedAt: atTen.quotedAt,
            filledAt: duringSessionForTest,
          },
        },
      }),
    ],
  });
});

test("keeps an order waiting while the latest update could not fetch its stock, instead of filling it at the stored quote that the market may have left, and fills it with the next quote that an update fetches", async () => {
  // BBCA is fetched at 09:51, and the update at 09:55 brings TLKM but not BBCA.
  const { database, owner } = await studentWithQuotesForTest(
    [atTen],
    new Date("2026-11-02T02:51:00Z"),
  );
  await updateQuotesForTest(database, sourceAnsweringForTest([tlkmOfFriday]), {
    at: new Date("2026-11-02T02:55:00Z"),
  });
  expect(findStockQuote(database, "BBCA")).toEqual(atTen);
  const latestAttempt = readLatestUpdateAttempt(database, "quotes");
  expect(latestAttempt?.succeeded).toBe(true);
  expect(latestAttempt?.failedCodes).toContain("BBCA");
  // At 10:00, a limit of Rp5,000 is above the stored price of Rp4,980.
  placedOrderForTest(
    database,
    owner,
    purchaseForTest({ price: limitForTest(5_000) }),
  );
  const waiting = readStoredPortfolio(database, owner.membershipId);
  expect(waiting?.orders[0]?.state).toEqual({ kind: "waiting" });
  expect(waiting?.holdings).toEqual([]);
  // Quoted at 09:51 and fetched at 10:01, below the limit.
  const fetched = stockQuote("BBCA", [4_990, 4_980], "2026-11-02T02:51:00Z");
  const fetchedAt = new Date("2026-11-02T03:01:00Z");
  await updateQuotesForTest(database, sourceAnsweringForTest([fetched]), {
    at: fetchedAt,
  });
  checkAllOpenOrders(database, fetchedAt);
  const filled = readStoredPortfolio(database, owner.membershipId);
  expect(filled?.orders[0]?.state).toEqual({
    kind: "filled",
    fill: {
      price: 4_990,
      value: 2_495_000,
      fee: 3_743,
      tax: 0,
      cashChange: -2_498_743,
      quotedAt: fetched.quotedAt,
      filledAt: fetchedAt,
    },
  });
});

test("fills no order while the latest update failed, and marks an order expired once the prices of its trading day are final", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [atTen],
    new Date("2026-11-02T02:51:00Z"),
  );
  await updateQuotesForTest(database, failingSourceForTest, {
    at: new Date("2026-11-02T02:55:00Z"),
  });
  expect(findStockQuote(database, "BBCA")).toEqual(atTen);
  expect(readLatestUpdateAttempt(database, "quotes")?.succeeded).toBe(false);
  placedOrderForTest(database, owner, purchaseForTest());
  expect(
    readStoredPortfolio(database, owner.membershipId)?.orders[0]?.state,
  ).toEqual({ kind: "waiting" });
  checkAllOpenOrders(database, endOfMondayForTest);
  expect(readStoredPortfolio(database, owner.membershipId)).toMatchObject({
    cash: 100_000_000,
    orders: [{ state: { kind: "expired", expiredAt: endOfMondayForTest } }],
  });
});

test("checks the orders of a portfolio in the order in which they were placed, so a fill moves the cash that a later purchase can use", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaCloseOfFridayForTest],
    new Date("2026-11-02T01:40:00Z"),
  );
  // At 08:50 and 08:51, each purchase of 100 lots sets aside Rp49,874,700 at the close of Friday, Rp99,749,400 of the cash of Rp100 million together.
  for (const minute of ["50", "51"]) {
    placedOrderForTest(
      database,
      owner,
      purchaseForTest({
        lots: orderLotsForTest(100),
        placedAt: new Date(`2026-11-02T01:${minute}:00Z`),
      }),
    );
  }
  expect(
    readStoredPortfolio(database, owner.membershipId)?.orders.map(
      (order) => order.setAsideCash,
    ),
  ).toEqual([49_874_700, 49_874_700]);
  // Quoted at 09:00:30 and fetched at 09:01, a price of Rp5,000 makes each purchase cost Rp50,075,000. The first leaves Rp49,925,000.
  const firstOfSession = stockQuote(
    "BBCA",
    [5_000, 4_980],
    "2026-11-02T02:00:30Z",
  );
  const checkedAt = new Date("2026-11-02T02:01:00Z");
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([firstOfSession]),
    {
      at: checkedAt,
    },
  );
  checkAllOpenOrders(database, checkedAt);
  expect(readStoredPortfolio(database, owner.membershipId)).toMatchObject({
    cash: 49_925_000,
    holdings: [{ code: "BBCA", shares: 10_000, cost: 50_075_000 }],
    orders: [
      { state: { kind: "filled", fill: { price: 5_000 } } },
      {
        state: {
          kind: "rejected",
          rejectedAt: checkedAt,
          quotedAt: firstOfSession.quotedAt,
          failure: {
            kind: "priceRose",
            code: "BBCA",
            lots: 100,
            checkedPrice: 4_980,
            price: 5_000,
            value: 50_000_000,
            fee: 75_000,
            tax: 0,
            availableCash: 49_925_000,
          },
        },
      },
    ],
  });
});

test("fills a sale of every share of a holding, pays in its value less its costs, and removes the holding", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [atTen],
    new Date("2026-11-02T02:51:00Z"),
  );
  placedOrderForTest(database, owner, purchaseForTest());
  // Quoted at 09:55 and fetched at 10:05.
  const later = stockQuote("BBCA", [4_990, 4_980], "2026-11-02T02:55:00Z");
  const soldAt = new Date("2026-11-02T03:05:00Z");
  await updateQuotesForTest(database, sourceAnsweringForTest([later]), {
    at: soldAt,
  });
  placedOrderForTest(database, owner, saleForTest({ placedAt: soldAt }));
  expect(readStoredPortfolio(database, owner.membershipId)).toMatchObject({
    cash: 99_995_027,
    holdings: [],
    orders: [
      { state: { kind: "filled" } },
      {
        state: {
          kind: "filled",
          fill: {
            price: 4_990,
            value: 2_495_000,
            fee: 3_743,
            tax: 2_495,
            cashChange: 2_488_762,
          },
        },
      },
    ],
  });
});

test("rejects a sale whose holding a deletion by hand removed, when a price reaches it, and keeps the cash", async () => {
  const { database, owner } = await studentWithQuotesForTest(
    [atTen],
    new Date("2026-11-02T02:51:00Z"),
  );
  placedOrderForTest(database, owner, purchaseForTest());
  // At 10:02, before any fetched quote of a later minute, the sale waits for a price.
  const placedAt = new Date("2026-11-02T03:02:00Z");
  await updateQuotesForTest(database, failingSourceForTest, { at: placedAt });
  placedOrderForTest(database, owner, saleForTest({ placedAt }));
  database
    .delete(holdings)
    .where(eq(holdings.membershipId, owner.membershipId))
    .run();
  expect(readStoredPortfolio(database, owner.membershipId)?.holdings).toEqual(
    [],
  );
  const later = stockQuote("BBCA", [4_990, 4_980], "2026-11-02T02:55:00Z");
  const checkedAt = new Date("2026-11-02T03:05:00Z");
  await updateQuotesForTest(database, sourceAnsweringForTest([later]), {
    at: checkedAt,
  });
  checkAllOpenOrders(database, checkedAt);
  expect(readStoredPortfolio(database, owner.membershipId)).toMatchObject({
    cash: 97_506_265,
    holdings: [],
    orders: [
      { state: { kind: "filled" } },
      {
        state: {
          kind: "rejected",
          failure: {
            kind: "sharesGone",
            code: "BBCA",
            lots: 5,
            availableLots: 0,
          },
        },
      },
    ],
  });
});

test("checks the open orders of every portfolio", async () => {
  const database = openDatabaseForTest();
  storeBbcaHistoryForTest(database);
  const first = await studentPortfolioForTest(database);
  const second = await studentPortfolioForTest(database, "mahasiswi");
  await updateQuotesForTest(database, sourceAnsweringForTest([atTen]), {
    at: new Date("2026-11-02T02:51:00Z"),
  });
  await updateQuotesForTest(database, failingSourceForTest, {
    at: new Date("2026-11-02T02:55:00Z"),
  });
  for (const owner of [first, second]) {
    placedOrderForTest(database, owner, purchaseForTest());
  }
  const fetchedAt = new Date("2026-11-02T03:01:00Z");
  await updateQuotesForTest(database, sourceAnsweringForTest([atTen]), {
    at: fetchedAt,
  });
  checkAllOpenOrders(database, fetchedAt);
  for (const owner of [first, second]) {
    expect(readStoredPortfolio(database, owner.membershipId)).toMatchObject({
      cash: 97_506_265,
      orders: [{ state: { kind: "filled", fill: { filledAt: fetchedAt } } }],
    });
  }
});
