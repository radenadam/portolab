import { expect, test } from "vitest";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import type { IndexQuote } from "~/features/market-data/price-source.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { readLatestUpdateAttempt } from "~/features/market-data/update-attempts.server";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { indexPoints } from "~/units/index-points";
import { duringSessionForTest } from "./orders-for-test";
import { readPortfolio } from "./portfolio-store.server";
import { readPortfolioReport } from "./read-portfolio-report.server";
import {
  recordedBbcaForTest,
  recordedIhsgForTest,
  tradedPortfolioForTest,
} from "./traded-portfolio-for-test.server";

// The values come from the cash, the holding, and the closes that tradedPortfolioForTest describes, and were computed with the decimal module of Python at 50 significant digits. 10:00 WIB on Wednesday 4 November 2026 comes after the prices of Tuesday became final.
const wednesday = new Date("2026-11-04T03:00:00Z");
const delayMinutes = 10;

test("values a portfolio at the latest delayed prices and replays its return since the start at the stored closes from the start on", async () => {
  const { database, owner } = await tradedPortfolioForTest();
  saveDailyHistory(database, recordedIhsgForTest());
  saveDailyHistory(database, recordedBbcaForTest());
  const report = readPortfolioReport(
    database,
    {
      portfolio: readPortfolio(database, owner),
      startingCash: owner.startingCash,
      joinedAt: duringSessionForTest,
    },
    { now: wednesday, delayMinutes },
  );
  expect(report.valuation.total).toEqual({
    holdingsValue: 48_400_000,
    value: 96_929_600,
    return: closeToForTest(-0.030704, 15),
  });
  expect(report.history).toEqual({
    ok: true,
    value: {
      points: [
        {
          date: "2026-10-30",
          portfolio: closeToForTest(0, 15),
          market: closeToForTest(0, 15),
        },
        {
          date: "2026-11-02",
          portfolio: closeToForTest(-0.001494, 15),
          market: closeToForTest(0.00786624613163801, 15),
        },
        {
          date: "2026-11-03",
          portfolio: closeToForTest(-0.030704, 15),
          market: closeToForTest(-0.03020733431546059, 15),
        },
      ],
      end: {
        kind: "notFinal",
        date: "2026-11-04",
        finalAt: new Date("2026-11-04T09:26:00Z"),
      },
    },
  });
});

test("names among the prices that the latest update could not fetch only those of the holdings", async () => {
  const { database, owner } = await tradedPortfolioForTest();
  const member = {
    portfolio: readPortfolio(database, owner),
    startingCash: owner.startingCash,
    joinedAt: duringSessionForTest,
  };
  const latestAttempt = readLatestUpdateAttempt(database, "quotes");
  expect(latestAttempt?.failedCodes).toContain("TLKM");
  expect(latestAttempt?.failedCodes).not.toContain("BBCA");
  expect(
    readPortfolioReport(database, member, { now: wednesday, delayMinutes })
      .quoteAttempt?.failedCodes,
  ).toEqual([]);
  // An update at 10:01 that brought the price of TLKM but not the price of BBCA.
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([
      stockQuote("TLKM", [1_980, 1_980], "2026-11-04T02:50:00Z"),
    ]),
    { at: new Date("2026-11-04T03:01:00Z") },
  );
  expect(
    readPortfolioReport(database, member, { now: wednesday, delayMinutes })
      .quoteAttempt?.failedCodes,
  ).toEqual(["BBCA"]);
});

test("has no history of a student who joined on a date that no calendar covers", async () => {
  const { database, owner } = await tradedPortfolioForTest();
  expect(
    readPortfolioReport(
      database,
      {
        portfolio: readPortfolio(database, owner),
        startingCash: owner.startingCash,
        joinedAt: new Date("2028-01-03T03:00:00Z"),
      },
      { now: wednesday, delayMinutes },
    ).history,
  ).toEqual({ ok: false, failure: { kind: "missingCalendar" } });
});

test("gives the return of the IHSG since the close at the start at its latest delayed level, and names the IHSG among the prices that the latest update could not fetch only while the report gives that return", async () => {
  const { database, owner } = await tradedPortfolioForTest();
  const member = {
    portfolio: readPortfolio(database, owner),
    startingCash: owner.startingCash,
    joinedAt: duringSessionForTest,
  };
  const report = (): ReturnType<typeof readPortfolioReport> =>
    readPortfolioReport(database, member, { now: wednesday, delayMinutes });
  // The IHSG at its close of Tuesday 3 November 2026, which an update at 09:00 on Wednesday brought with the price of BBCA.
  const ihsgOfTuesday: IndexQuote = {
    kind: "index",
    code: "IHSG",
    level: indexPoints(4_904.29),
    previousLevel: indexPoints(5_096.83),
    quotedAt: new Date("2026-11-03T09:14:00Z"),
  };
  const bbcaOfTuesday = stockQuote(
    "BBCA",
    [4_840, 4_980],
    "2026-11-03T09:14:00Z",
  );
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([ihsgOfTuesday, bbcaOfTuesday]),
    { at: new Date("2026-11-04T02:00:00Z") },
  );
  expect(report().market).toEqual({
    quote: ihsgOfTuesday,
    return: closeToForTest(-0.03020733431546059, 15),
  });
  expect(report().quoteAttempt?.failedCodes).toEqual([]);
  // An update at 10:01 that brought the price of BBCA but not the level of the IHSG, whose stored level the report keeps.
  await updateQuotesForTest(database, sourceAnsweringForTest([bbcaOfTuesday]), {
    at: new Date("2026-11-04T03:01:00Z"),
  });
  expect(report().market?.quote).toEqual(ihsgOfTuesday);
  expect(report().quoteAttempt?.failedCodes).toEqual(["IHSG"]);
  // A student who joined on a date that no calendar covers has no start, so the IHSG has no return to show and no failure to name.
  const withoutStart = readPortfolioReport(
    database,
    { ...member, joinedAt: new Date("2028-01-03T03:00:00Z") },
    { now: wednesday, delayMinutes },
  );
  expect(withoutStart.market).toBeUndefined();
  expect(withoutStart.quoteAttempt?.failedCodes).toEqual([]);
});
