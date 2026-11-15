import {
  createClass,
  findTaughtClass,
} from "~/features/classes/class-store.server";
import {
  storedPortfolioIdForTest,
  storeBbcaHistoryForTest,
  storeHoldingsForTest,
  studentPortfolioForTest,
  placedOrderForTest,
} from "./portfolios-for-test.server";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { createLecturerWithClassForTest } from "~/features/classes/classes-for-test.server";
import { classes, memberships } from "~/features/classes/classes.schema";
import type { Database } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { cancelPortfolioOrder } from "./cancel-portfolio-order.server";
import { checkAllOpenOrders } from "./check-open-orders.server";
import { readPortfolio, findPortfolioId } from "./portfolio-store.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { portfolios, holdings, orders } from "./trading.schema";
import {
  bbcaForTest,
  bbcaCloseOfFridayForTest,
  duringSessionForTest,
  purchaseForTest,
  saleForTest,
  limitForTest,
} from "./orders-for-test";

function demonstrationOfStudentClass(
  database: Database,
  student: Extract<PortfolioOwner, { kind: "membership" }>,
) {
  const membership = database
    .select()
    .from(memberships)
    .where(eq(memberships.id, student.membershipId))
    .get();
  if (membership === undefined)
    throw new Error("The student has no membership.");
  return {
    kind: "demonstration",
    classId: membership.classId,
    startingCash: student.startingCash,
  } as const;
}

test("fills demonstration and student orders by their separate portfolio ids in the price job", async () => {
  const database = openDatabaseForTest();
  const student = await studentPortfolioForTest(database);
  const demonstration = demonstrationOfStudentClass(database, student);
  storeHoldingsForTest(database, demonstration, {
    cash: demonstration.startingCash,
    holdings: [],
  });
  const demonstrationId = storedPortfolioIdForTest(database, demonstration);
  storeBbcaHistoryForTest(database);
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaCloseOfFridayForTest]),
    { at: bbcaCloseOfFridayForTest.quotedAt },
  );
  for (const owner of [demonstration, student]) {
    placedOrderForTest(database, owner, purchaseForTest());
    expect(readPortfolio(database, owner).orders[0]?.state.kind).toBe(
      "waiting",
    );
  }
  expect(findPortfolioId(database, student)).not.toBe(demonstrationId);
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaForTest.quote]),
    { at: bbcaForTest.quote.quotedAt },
  );
  checkAllOpenOrders(database, duringSessionForTest);
  // Python Decimal gives the same 2,493,735 purchase cost for each independent portfolio.
  for (const owner of [demonstration, student]) {
    expect(readPortfolio(database, owner)).toMatchObject({
      cash: 97_506_265,
      holdings: [{ code: "BBCA", shares: 500, cost: 2_493_735 }],
      orders: [{ state: { kind: "filled" } }],
    });
  }
});

test("starts each demonstration with its class cash and trades, fills, sells, and cancels through the common store without a membership", async () => {
  const database = openDatabaseForTest();
  const { classId, lecturerId } =
    await createLecturerWithClassForTest(database);
  const taught = findTaughtClass(database, classId, lecturerId);
  if (taught === undefined) throw new Error("The test lecturer has no class.");
  expect(taught.startingCash).toBe(100_000_000);
  const owner: PortfolioOwner = {
    kind: "demonstration",
    classId,
    startingCash: taught.startingCash,
  };
  expect(readPortfolio(database, owner)).toEqual({
    cash: 100_000_000,
    holdings: [],
    orders: [],
  });
  expect(findPortfolioId(database, owner)).toBeUndefined();
  storeBbcaHistoryForTest(database);
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaForTest.quote]),
    { at: bbcaForTest.quote.quotedAt },
  );
  const bought = placedOrderForTest(database, owner, purchaseForTest());
  const portfolioId = findPortfolioId(database, owner);
  expect(portfolioId).toBeDefined();
  // Python Decimal gives 2,493,735 for the purchase and 2,483,775 for the sale at 4,980, including fees and tax.
  expect(readPortfolio(database, owner)).toMatchObject({
    cash: 97_506_265,
    holdings: [{ code: "BBCA", shares: 500, cost: 2_493_735 }],
    orders: [{ id: bought, state: { kind: "filled" } }],
  });
  placedOrderForTest(database, owner, saleForTest());
  expect(readPortfolio(database, owner)).toMatchObject({
    cash: 99_990_040,
    holdings: [],
  });
  const waiting = placedOrderForTest(
    database,
    owner,
    purchaseForTest({ price: limitForTest(4_950) }),
  );
  expect(readPortfolio(database, owner).orders.at(-1)?.state.kind).toBe(
    "resting",
  );
  expect(
    cancelPortfolioOrder(
      database,
      { owner, orderId: waiting },
      duringSessionForTest,
    ).ok,
  ).toBe(true);
  expect(readPortfolio(database, owner).orders.at(-1)?.state.kind).toBe(
    "cancelled",
  );
  const nextDay = new Date("2026-11-02T10:00:00Z");
  placedOrderForTest(database, owner, purchaseForTest({ placedAt: nextDay }));
  expect(readPortfolio(database, owner).orders.at(-1)?.state.kind).toBe(
    "waiting",
  );
  checkAllOpenOrders(database, new Date("2026-11-03T10:00:00Z"));
  expect(readPortfolio(database, owner).orders.at(-1)?.state.kind).toBe(
    "expired",
  );
  expect(database.select().from(memberships).all()).toEqual([]);
  const otherCash = rupiah(250_000_000);
  const otherClassId = createClass(
    database,
    {
      lecturerId,
      name: "Other",
      startingCash: otherCash,
      firstSessionDate: "2026-09-07",
    },
    duringSessionForTest,
  );
  expect(
    readPortfolio(database, {
      kind: "demonstration",
      classId: otherClassId,
      startingCash: otherCash,
    }).cash,
  ).toBe(250_000_000);
});

test("requires exactly one unique owner and cascades each portfolio through its own owner", async () => {
  const database = openDatabaseForTest();
  const student = await studentPortfolioForTest(database);
  const owner = demonstrationOfStudentClass(database, student);
  storeHoldingsForTest(database, student, {
    cash: student.startingCash,
    holdings: [],
  });
  storeHoldingsForTest(database, owner, {
    cash: owner.startingCash,
    holdings: [],
  });
  const demoId = storedPortfolioIdForTest(database, owner);
  const studentId = storedPortfolioIdForTest(database, student);
  expect(demoId).not.toBe(studentId);
  expect(demoId).not.toBe(owner.classId);
  expect(() =>
    database.insert(portfolios).values({ cash: student.startingCash }).run(),
  ).toThrow();
  expect(() =>
    database
      .insert(portfolios)
      .values({
        membershipId: student.membershipId,
        demonstrationClassId: owner.classId,
        cash: student.startingCash,
      })
      .run(),
  ).toThrow();
  expect(() =>
    database
      .insert(portfolios)
      .values({
        demonstrationClassId: owner.classId,
        cash: student.startingCash,
      })
      .run(),
  ).toThrow();
  storeBbcaHistoryForTest(database);
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaForTest.quote]),
    { at: bbcaForTest.quote.quotedAt },
  );
  const demoOrder = placedOrderForTest(database, owner, purchaseForTest());
  expect(readPortfolio(database, owner).holdings).toEqual([
    { code: "BBCA", shares: shares(500), cost: rupiah(2_493_735) },
  ]);
  expect(
    cancelPortfolioOrder(
      database,
      { owner: student, orderId: demoOrder },
      duringSessionForTest,
    ),
  ).toEqual({ ok: false, failure: { kind: "missing" } });
  database
    .delete(memberships)
    .where(eq(memberships.id, student.membershipId))
    .run();
  expect(findPortfolioId(database, student)).toBeUndefined();
  expect(findPortfolioId(database, owner)).toBe(demoId);
  database.delete(classes).where(eq(classes.id, owner.classId)).run();
  expect(database.select().from(portfolios).all()).toEqual([]);
  expect(database.select().from(holdings).all()).toEqual([]);
  expect(database.select().from(orders).all()).toEqual([]);
});
