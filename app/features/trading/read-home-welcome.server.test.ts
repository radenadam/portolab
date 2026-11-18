import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { databaseWithClosesForTest } from "~/features/measures/measures-for-test.server";
import { rupiah } from "~/units/rupiah";
import { activityOrderForTest } from "./activity-for-test";
import { readHomeWelcome } from "./read-home-welcome.server";
import type { Portfolio } from "./portfolio-store.server";

const startingCash = rupiah(125_000_000);
const now = new Date("2026-11-02T03:05:00Z");
const empty: Portfolio = { cash: startingCash, holdings: [], orders: [] };

test("offers the welcome with the class cash and actual stored history before any order", () => {
  const database = databaseWithClosesForTest();
  const welcome = readHomeWelcome(database, {
    portfolio: empty,
    startingCash,
    now,
  });
  expect(welcome).toBeDefined();
  if (welcome === undefined)
    throw new Error("The empty portfolio has no welcome.");
  expect(welcome.startingCash).toBe(startingCash);
  expect(welcome.indexHistory.months).toBe(3);
  expect(welcome.indexHistory.end).toBe("2026-10-30");
  expect(welcome.indexHistory.values).toHaveLength(3);
  expect(welcome.riskFree.ok).toBe(true);
});

test("keeps a pending order and a cash-only portfolio with a cancelled order in the regular summary", () => {
  const database = openDatabaseForTest();
  for (const order of [
    activityOrderForTest(1),
    activityOrderForTest(2, { state: { kind: "cancelled", cancelledAt: now } }),
  ]) {
    const portfolio = { ...empty, orders: [order] };
    expect(portfolio.holdings).toEqual([]);
    expect(portfolio.orders).toHaveLength(1);
    expect(
      readHomeWelcome(database, { portfolio, startingCash, now }),
    ).toBeUndefined();
  }
});

test("keeps changed cash visible when all holdings and order records have been deleted", () => {
  const database = openDatabaseForTest();
  for (const cash of [rupiah(0), rupiah(124_999_999), rupiah(125_000_001)]) {
    const portfolio = { ...empty, cash };
    expect(portfolio.cash).not.toBe(startingCash);
    expect(portfolio.holdings).toEqual([]);
    expect(portfolio.orders).toEqual([]);
    expect(
      readHomeWelcome(database, { portfolio, startingCash, now }),
    ).toBeUndefined();
  }
});
