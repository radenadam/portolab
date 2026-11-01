import { expect, test } from "vitest";
import { portfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { Database } from "~/database/database.server";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import { defaultEstimationSettings } from "./estimation-settings";
import { measurePortfolio } from "./measure-portfolio";
import { measureStock } from "./measure-stock";
import {
  measureStoredPortfolio,
  measureStoredStock,
} from "./measure-stored.server";
import { monthEndClosesForTest } from "./month-end-closes-for-test";

// measure-stock.test.ts and measure-portfolio.test.ts check the values against Python, so these tests check that the stored closes reach the same measures.
const ihsg = monthEndClosesForTest("IHSG");
const bbca = monthEndClosesForTest("BBCA");
const tlkm = monthEndClosesForTest("TLKM");

function databaseWithCloses(): Database {
  const database = openDatabaseForTest();
  saveDailyHistory(database, ihsg);
  saveDailyHistory(database, bbca);
  saveDailyHistory(database, tlkm);
  return database;
}

test("measures a stock from its stored closes and those of the IHSG", () => {
  expect(measureStoredStock(databaseWithCloses(), "BBCA")).toEqual(
    measureStock(bbca, ihsg, defaultEstimationSettings),
  );
});

test("measures a portfolio from the stored closes of its holdings, weighted by their share of its value with the cash", () => {
  // Rp50 million in BBCA, Rp30 million in TLKM, and Rp20 million in cash give weights of 0.5 and 0.3.
  expect(
    measureStoredPortfolio(databaseWithCloses(), {
      holdings: [
        { code: "BBCA", value: rupiah(50_000_000) },
        { code: "TLKM", value: rupiah(30_000_000) },
      ],
      cash: rupiah(20_000_000),
    }),
  ).toEqual(
    measurePortfolio(
      [
        { ...bbca, weight: portfolioWeight(0.5) },
        { ...tlkm, weight: portfolioWeight(0.3) },
      ],
      ihsg,
      defaultEstimationSettings,
    ),
  );
});

test("fails for a stock without stored closes, and names it", () => {
  expect(measureStoredStock(databaseWithCloses(), "ASII")).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "ASII", count: 0, minimum: 24 },
  });
});
