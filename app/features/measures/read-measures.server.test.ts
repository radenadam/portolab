import { expect, test } from "vitest";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import { rupiah } from "~/units/rupiah";
import { closeToForTest } from "./close-to-for-test";
import {
  aadiValuationForTest,
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import {
  readPortfolioMeasures,
  readStockMeasures,
  readStockRows,
} from "./read-measures.server";

// The expected values were computed with the decimal module of Python at 50 significant digits, as measure-stock.test.ts and measure-portfolio.test.ts give them. The measures of the portfolio with weights of 0.5 and 0.3 follow from those of BBCA and TLKM: the expected return and the beta are the sums of each measure times its weight, and the variance is 0.25 times the variance of BBCA, plus 0.09 times that of TLKM, plus 0.3 times their covariance.

test("measures a portfolio of BBCA, TLKM, and cash, weighted by their shares of its value at the delayed prices, with each pair of stocks once", () => {
  const report = readPortfolioMeasures(
    databaseWithClosesForTest(),
    valuationForTest(["BBCA", "TLKM"]),
  );
  expect(report).toMatchObject({
    kind: "measured",
    measures: {
      ok: true,
      value: {
        expectedReturn: closeToForTest(-0.0021586726703076266, 16),
        variance: closeToForTest(0.0016530039133445262, 16),
        beta: closeToForTest(0.6206929278148288, 14),
        cash: { value: 10_956_000, weight: 0.2 },
        totalValue: 54_780_000,
        holdings: [
          {
            code: "BBCA",
            value: 27_390_000,
            weight: 0.5,
            expectedReturn: closeToForTest(-0.0010226485841997692, 16),
            beta: closeToForTest(0.6893713956004657, 14),
            returns: { length: 60 },
          },
          {
            code: "TLKM",
            value: 16_434_000,
            weight: 0.3,
            expectedReturn: closeToForTest(-0.005491161260692473, 16),
            beta: closeToForTest(0.9200241000486532, 14),
            returns: { length: 60 },
          },
        ],
        pairs: [
          {
            first: "BBCA",
            second: "BBCA",
            covariance: closeToForTest(0.0027323758291948595, 16),
            correlation: closeToForTest(1, 14),
          },
          {
            first: "BBCA",
            second: "TLKM",
            covariance: closeToForTest(0.001811061566626053, 16),
            correlation: closeToForTest(0.5032434833954371, 14),
          },
          {
            first: "TLKM",
            second: "TLKM",
            covariance: closeToForTest(0.004739905400644395, 16),
            correlation: closeToForTest(1, 14),
          },
        ],
        market: {
          expectedReturn: closeToForTest(0.00045684092205129883, 16),
          variance: closeToForTest(0.0020491485788355964, 16),
          returns: { length: 60 },
        },
      },
    },
  });
});

test("measures no portfolio that holds no shares", () => {
  expect(
    readPortfolioMeasures(
      databaseWithClosesForTest(),
      valuePortfolio(
        { cash: rupiah(100_000_000), holdings: [] },
        rupiah(100_000_000),
        new Map(),
      ),
    ),
  ).toEqual({ kind: "noHoldings" });
});

test("measures no portfolio while a holding has no delayed price to weigh it with, and names each such holding", () => {
  const database = databaseWithClosesForTest();
  expect(readPortfolioMeasures(database, valuationForTest(["BBCA"]))).toEqual({
    kind: "unpriced",
    codes: ["TLKM"],
  });
  expect(readPortfolioMeasures(database, valuationForTest([]))).toEqual({
    kind: "unpriced",
    codes: ["BBCA", "TLKM"],
  });
});

test("fails for a portfolio whose holdings share too few returns, with the month that brings enough", () => {
  // forecast-enough-returns.test.ts explains the month of AADI.
  expect(
    readPortfolioMeasures(databaseWithClosesForTest(), aadiValuationForTest()),
  ).toEqual({
    kind: "measured",
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
  });
});

test("measures every stock that Portolab tracks, in their order, or says why a stock has none", () => {
  const rows = readStockRows(databaseWithClosesForTest());
  expect(rows.map((row) => row.code)).toEqual(trackedStockCodes);
  expect(rows.find((row) => row.code === "BBCA")).toEqual({
    code: "BBCA",
    measures: {
      ok: true,
      value: {
        expectedReturn: closeToForTest(-0.0010226485841997692, 16),
        standardDeviation: closeToForTest(0.05227213243397345, 15),
        beta: closeToForTest(0.6893713956004657, 14),
      },
    },
  });
  expect(rows.find((row) => row.code === "ADMR")).toEqual({
    code: "ADMR",
    measures: {
      ok: false,
      failure: {
        kind: "tooFewReturns",
        code: "ADMR",
        count: 0,
        minimum: 24,
        enoughAfterFirstTradingDayOf: { ok: false, failure: { code: "ADMR" } },
      },
    },
  });
});

test("measures one stock with the inputs that its page shows, over the months that it shares with the IHSG", () => {
  // AMMN listed in July 2023, so it shares 38 monthly returns with the IHSG.
  expect(readStockMeasures(databaseWithClosesForTest(), "AMMN")).toMatchObject({
    ok: true,
    value: {
      code: "AMMN",
      returns: { length: 38 },
      expectedReturn: closeToForTest(0.028220485911893658, 16),
      standardDeviation: closeToForTest(0.18429693326878036, 15),
      beta: { value: closeToForTest(1.110656361185523, 14) },
      requiredReturn: { value: closeToForTest(-0.002765178988848664, 16) },
      securityMarketLine: {
        value: closeToForTest(0.03098566490074232, 16),
      },
      market: {
        returns: { length: 38 },
        expectedReturn: closeToForTest(-0.002012279107748291, 16),
      },
    },
  });
});
