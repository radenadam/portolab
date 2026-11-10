import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
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
  measureStoredStocks,
} from "./measure-stored.server";
import { monthEndClosesForTest } from "./month-end-closes-for-test";

// measure-stock.test.ts and measure-portfolio.test.ts check the values against Python, so these tests check that the stored closes reach the same measures.
const ihsg = monthEndClosesForTest("IHSG");
const bbca = monthEndClosesForTest("BBCA");
const tlkm = monthEndClosesForTest("TLKM");
const aadi = monthEndClosesForTest("AADI");

function databaseWithCloses(): Database {
  const database = openDatabaseForTest();
  for (const history of [ihsg, bbca, tlkm, aadi]) {
    saveDailyHistory(database, history);
  }
  return database;
}

test("measures each stock from its stored closes and those of the IHSG, in the order of the codes", () => {
  expect(measureStoredStocks(databaseWithCloses(), ["TLKM", "BBCA"])).toEqual([
    {
      code: "TLKM",
      measures: measureStock(tlkm, ihsg, defaultEstimationSettings),
    },
    {
      code: "BBCA",
      measures: measureStock(bbca, ihsg, defaultEstimationSettings),
    },
  ]);
});

test("fails for a stock with too few returns, with the month whose first trading day brings enough, or the stock without stored closes", () => {
  // forecast-enough-returns.test.ts explains the month of AADI.
  expect(measureStoredStocks(databaseWithCloses(), ["AADI", "ASII"])).toEqual([
    {
      code: "AADI",
      measures: {
        ok: false,
        failure: {
          kind: "tooFewReturns",
          code: "AADI",
          count: 21,
          minimum: 24,
          enoughAfterFirstTradingDayOf: { ok: true, value: "2027-01-01" },
        },
      },
    },
    {
      code: "ASII",
      measures: {
        ok: false,
        failure: {
          kind: "tooFewReturns",
          code: "ASII",
          count: 0,
          minimum: 24,
          enoughAfterFirstTradingDayOf: {
            ok: false,
            failure: { code: "ASII" },
          },
        },
      },
    },
  ]);
});

test("measures a portfolio from the stored closes of its holdings, weighted by their share of its value with the cash", () => {
  // Rp50 million in BBCA, Rp30 million in TLKM, and Rp20 million in cash give weights of 0.5, 0.3, and 0.2.
  const measures = successValueForTest(
    measurePortfolio(
      [
        { ...bbca, weight: portfolioWeight(0.5) },
        { ...tlkm, weight: portfolioWeight(0.3) },
      ],
      ihsg,
      defaultEstimationSettings,
    ),
    "BBCA and TLKM share enough monthly returns",
  );
  expect(
    measureStoredPortfolio(databaseWithCloses(), {
      holdings: [
        { code: "BBCA", value: rupiah(50_000_000) },
        { code: "TLKM", value: rupiah(30_000_000) },
      ],
      cash: rupiah(20_000_000),
    }),
  ).toEqual({
    ok: true,
    value: { ...measures, cashWeight: portfolioWeight(0.2) },
  });
});

test("fails for a portfolio whose holdings share too few returns, and names the holding with the fewest and the month whose first trading day brings enough", () => {
  expect(
    measureStoredPortfolio(databaseWithCloses(), {
      holdings: [
        { code: "AADI", value: rupiah(50_000_000) },
        { code: "BBCA", value: rupiah(30_000_000) },
      ],
      cash: rupiah(20_000_000),
    }),
  ).toEqual({
    ok: false,
    failure: {
      kind: "tooFewReturns",
      code: "AADI",
      count: 21,
      minimum: 24,
      enoughAfterFirstTradingDayOf: { ok: true, value: "2027-01-01" },
    },
  });
});
