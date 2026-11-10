import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { indexHistoryForTest } from "~/features/market-data/history-for-test";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { closeToForTest } from "./close-to-for-test";
import {
  aadiValuationForTest,
  ammnValuationForTest,
  cashValuationForTest,
  databaseWithClosesForTest,
  studentLineForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import {
  readPortfolioLine,
  readPortfolioMeasures,
  readStockMeasures,
  readStockRows,
} from "./read-measures.server";

// The expected values were computed with the decimal module of Python at 50 significant digits, as measure-stock.test.ts and measure-portfolio.test.ts give them. The measures of the portfolio with weights of 0.5 and 0.3 follow from those of BBCA and TLKM: the expected return and the beta are the sums of each measure times its weight, and the variance is 0.25 times the variance of BBCA, plus 0.09 times that of TLKM, plus 0.3 times their covariance.

// The 60 monthly returns from October 2021 to September 2026 give the security market line of BBCA, TLKM, and every portfolio of them, with the BI-Rate of 5.75% that held on 30 September 2026. AMMN listed in July 2023, so its 38 returns from August 2023 give another line.
const fiveYearLine = {
  riskFreeRate: closeToForTest(0.004791666666666666, 17),
  marketExpectedReturn: closeToForTest(0.00045684092205129883, 16),
};
const fiveYearMonths = { count: 60, first: "2021-10-29", last: "2026-09-30" };
const stocksOnFiveYearLine = [
  {
    code: "BBCA",
    beta: closeToForTest(0.6893713956004657, 14),
    expectedReturn: closeToForTest(-0.0010226485841997692, 16),
    distance: closeToForTest(-0.002826010377616112, 16),
  },
  {
    code: "TLKM",
    beta: closeToForTest(0.9200241000486532, 14),
    expectedReturn: closeToForTest(-0.005491161260692473, 16),
    distance: closeToForTest(-0.006294683772801653, 16),
  },
];

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
            distance: closeToForTest(-0.002826010377616112, 16),
            returns: { length: 60 },
          },
          {
            code: "TLKM",
            value: 16_434_000,
            weight: 0.3,
            expectedReturn: closeToForTest(-0.005491161260692473, 16),
            beta: closeToForTest(0.9200241000486532, 14),
            distance: closeToForTest(-0.006294683772801653, 16),
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
    readPortfolioMeasures(databaseWithClosesForTest(), cashValuationForTest()),
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
        line: fiveYearLine,
        distance: closeToForTest(-0.002826010377616112, 16),
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

test("gives the line of the months of a portfolio with measures, with the portfolio and its stocks, and no line for a portfolio without measures", () => {
  const database = databaseWithClosesForTest();
  // The distance of the portfolio is that of each stock times its weight, less the weight of the cash times the risk-free rate, as decision 0021 explains: 0.5 × -0.002826010377616112 + 0.3 × -0.006294683772801653 - 0.2 × 0.0575 / 12.
  expect(
    readPortfolioLine(
      readPortfolioMeasures(database, valuationForTest(["BBCA", "TLKM"])),
    ),
  ).toEqual({
    line: { ...fiveYearLine, months: fiveYearMonths },
    portfolio: {
      beta: closeToForTest(0.6206929278148288, 14),
      expectedReturn: closeToForTest(-0.0021586726703076266, 16),
      distance: closeToForTest(-0.004259743653981885, 16),
    },
    holdings: stocksOnFiveYearLine,
  });
  for (const valuation of [
    valuationForTest(["BBCA"]),
    aadiValuationForTest(),
    cashValuationForTest(),
  ]) {
    expect(
      readPortfolioLine(readPortfolioMeasures(database, valuation)),
    ).toBeUndefined();
  }
});

test("draws the line of the months of a portfolio for its student, with each stock that it does not hold on that line, the stocks on other lines, and whether a stock has no measures", () => {
  const database = databaseWithClosesForTest();
  const valuation = valuationForTest(["BBCA", "TLKM"]);
  expect(studentLineForTest(database, valuation)).toEqual({
    ok: true,
    value: {
      kind: "portfolio",
      portfolioLine: readPortfolioLine(
        readPortfolioMeasures(database, valuation),
      ),
      others: { onLine: [], otherLineCodes: ["AMMN"], hasUnmeasured: true },
    },
  });
  // A portfolio of AMMN has the line of the 38 months that AMMN shares with the IHSG, and the stocks with five years of returns lie against another line.
  expect(studentLineForTest(database, ammnValuationForTest())).toMatchObject({
    ok: true,
    value: {
      kind: "portfolio",
      portfolioLine: {
        line: {
          riskFreeRate: closeToForTest(0.004791666666666666, 17),
          marketExpectedReturn: closeToForTest(-0.002012279107748291, 16),
          months: { count: 38, first: "2023-08-31", last: "2026-09-30" },
        },
        holdings: [{ code: "AMMN" }],
      },
      others: {
        onLine: [],
        otherLineCodes: ["BBCA", "TLKM"],
        hasUnmeasured: true,
      },
    },
  });
});

test("draws the line of the latest complete months of the IHSG while the portfolio has no measures, with the stocks that it holds apart from the other stocks on the line", () => {
  const database = databaseWithClosesForTest();
  const latest = (
    holdings: readonly unknown[],
    onLine: readonly unknown[],
  ): unknown => ({
    ok: true,
    value: {
      kind: "latest",
      line: { ...fiveYearLine, months: fiveYearMonths },
      holdings,
      others: { onLine, otherLineCodes: ["AMMN"], hasUnmeasured: true },
    },
  });
  // A portfolio of cash and one of AADI hold no stock on the line. The portfolio of BBCA and TLKM lacks a delayed price of TLKM, so it has no measures, but it still holds both stocks.
  expect(readPortfolioMeasures(database, cashValuationForTest())).toEqual({
    kind: "noHoldings",
  });
  expect(readPortfolioMeasures(database, aadiValuationForTest())).toMatchObject(
    { kind: "measured", measures: { ok: false } },
  );
  expect(readPortfolioMeasures(database, valuationForTest(["BBCA"]))).toEqual({
    kind: "unpriced",
    codes: ["TLKM"],
  });
  expect(studentLineForTest(database, cashValuationForTest())).toEqual(
    latest([], stocksOnFiveYearLine),
  );
  expect(studentLineForTest(database, aadiValuationForTest())).toEqual(
    latest([], stocksOnFiveYearLine),
  );
  expect(studentLineForTest(database, valuationForTest(["BBCA"]))).toEqual(
    latest(stocksOnFiveYearLine, []),
  );
  expect(
    studentLineForTest(
      database,
      cashValuationForTest(),
      readStockRows(database).filter(({ measures }) => measures.ok),
    ),
  ).toMatchObject({ ok: true, value: { others: { hasUnmeasured: false } } });
});

test("names a stock that the portfolio holds on another line or without measures among the stocks that are not on the line of the latest months", () => {
  // AMMN listed in July 2023 and AADI in December 2024, so AMMN lies against the line of its own 38 months and AADI has no measures, whether the portfolio holds them or not. The portfolio of both stocks has no delayed price of either, so it has no measures, and the chart draws the line of the latest months. Each holding cost what measures-for-test.server.ts gives for it.
  const database = databaseWithClosesForTest();
  const heldValuation = valuePortfolio(
    {
      cash: rupiah(10_000_000),
      holdings: [
        { code: "AMMN", shares: shares(1_000), cost: rupiah(3_655_475) },
        { code: "AADI", shares: shares(1_000), cost: rupiah(11_492_213) },
      ],
    },
    rupiah(25_147_688),
    new Map(),
  );
  expect(readPortfolioMeasures(database, heldValuation)).toEqual({
    kind: "unpriced",
    codes: ["AMMN", "AADI"],
  });
  const stocks = readStockRows(database).filter(
    ({ code }) => code === "AMMN" || code === "AADI",
  );
  for (const valuation of [heldValuation, cashValuationForTest()]) {
    expect(studentLineForTest(database, valuation, stocks)).toMatchObject({
      ok: true,
      value: {
        kind: "latest",
        holdings: [],
        others: { onLine: [], otherLineCodes: ["AMMN"], hasUnmeasured: true },
      },
    });
  }
});

test("fails to draw the line while the IHSG has too few complete months, with the month that brings enough", () => {
  // The closes of the IHSG from September 2025 to October 2026 complete the months from September 2025 to September 2026, which give 12 returns. The returns of the 12 months from October 2026 to September 2027 bring 24, and the first trading day of October 2027 completes September 2027.
  const database = openDatabaseForTest();
  const ihsg = indexHistoryForTest(monthEndClosesForTest("IHSG"));
  saveDailyHistory(database, { ...ihsg, closes: ihsg.closes.slice(-14) });
  expect(studentLineForTest(database, cashValuationForTest())).toEqual({
    ok: false,
    failure: {
      kind: "tooFewReturns",
      code: "IHSG",
      count: 12,
      minimum: 24,
      enoughAfterFirstTradingDayOf: { ok: true, value: "2027-10-01" },
    },
  });
});
