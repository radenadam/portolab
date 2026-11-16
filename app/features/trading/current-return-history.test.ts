import { expect, test } from "vitest";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import { saveQuotes } from "~/features/market-data/quote-store.server";
import type {
  IndexQuote,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { indexHistoryForTest } from "~/features/market-data/history-for-test";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { historyEndText } from "./return-section";
import {
  historyStartDate,
  marketReturnSinceStart,
  portfolioHistory,
} from "./portfolio-history";
import { valuePortfolio } from "./value-portfolio";
import { currentReturnHistory } from "./current-return-history";
import { readPortfolio } from "./portfolio-store.server";
import { readPortfolioReport } from "./read-portfolio-report.server";
import {
  duringSessionForTest,
  orderLotsForTest,
  saleForTest,
} from "./orders-for-test";
import {
  placedOrderForTest,
  storedPortfolioIdForTest,
} from "./portfolios-for-test.server";
import { checkPortfolioOrders } from "./check-open-orders.server";
import {
  recordedBbcaForTest,
  recordedIhsgForTest,
  tradedPortfolioForTest,
} from "./traded-portfolio-for-test.server";

// Python Decimal at 50 digits gives (48,529,600 + 10,000 * 4,840) / 100,000,000 - 1 = -0.030704 and 4,904.29 / 5,057.05 - 1 = -0.0302073343154605946. The fixture takes the recorded Tuesday close as the intraday quote so the replay and the snapshot have independently known values.
const quote: IndexQuote = {
  kind: "index",
  code: "IHSG",
  level: indexPoints(4904.29),
  previousLevel: indexPoints(5096.83),
  quotedAt: new Date("2026-11-03T02:55:00Z"),
};

for (const scenario of [
  {
    title:
      "ends at the current valuation after a newer quote and fill without changing the final closes of earlier days",
    leftOut: ["2026-11-03"],
    end: "notFinal",
    now: new Date("2026-11-03T03:02:00Z"),
    quotedAt: quote.quotedAt,
    measuredAt: new Date("2026-11-03T03:00:00Z"),
  },
  {
    title:
      "keeps a stale snapshot before later stored closes instead of drawing a final close after its endpoint",
    leftOut: [],
    end: "snapshot",
    now: new Date("2026-11-04T03:00:00Z"),
    quotedAt: quote.quotedAt,
    measuredAt: new Date("2026-11-03T03:00:00Z"),
  },
  {
    title: "keeps the quote cutoff on an evening with that day's stored close",
    leftOut: [],
    end: "snapshot",
    now: new Date("2026-11-03T10:00:00Z"),
    quotedAt: new Date("2026-11-03T09:14:00Z"),
    measuredAt: new Date("2026-11-03T09:14:00Z"),
  },
  {
    title: "keeps the quote cutoff on a weekend after the closing quotes",
    leftOut: [],
    end: "snapshot",
    now: new Date("2026-11-07T03:00:00Z"),
    quotedAt: new Date("2026-11-03T09:14:00Z"),
    measuredAt: new Date("2026-11-03T09:14:00Z"),
  },
]) {
  test(scenario.title, async () => {
    const { database, owner } = await tradedPortfolioForTest();
    saveDailyHistory(database, recordedIhsgForTest(scenario.leftOut));
    saveDailyHistory(database, recordedBbcaForTest(scenario.leftOut));
    saveQuotes(
      database,
      [{ ...quote, quotedAt: scenario.quotedAt }],
      scenario.now,
    );
    const report = reportAt({ database, owner }, scenario.now);
    expect(report.history.ok).toBe(true);
    if (!report.history.ok) throw new Error("The fixture has a calendar.");
    expect(report.history.value.end.kind).toBe(scenario.end);
    expect(report.valuation.total?.value).toBe(96_929_600);
    expect(report.history.value.points).toEqual([
      { date: "2026-10-30", portfolio: 0, market: 0 },
      {
        date: "2026-11-02",
        portfolio: closeToForTest(-0.001494, 15),
        market: closeToForTest(0.00786624613163801, 15),
      },
      {
        date: "2026-11-03",
        measuredAt: scenario.measuredAt,
        portfolio: closeToForTest(-0.030704, 15),
        market: closeToForTest(-0.03020733431546059, 15),
      },
    ]);
  });
}

const snapshotTexts: Record<Locale, string> = {
  id: "Waktu di ujung grafik berasal dari harga atau transaksi terisi terbaru. Pembaruan harga memajukan titik itu jika membawa harga yang dapat dipakai dengan waktu yang lebih baru. Order yang terisi dengan waktu yang lebih baru juga memajukannya.",
  en: "The time at the end of the chart comes from its latest quote or fill. A price update moves that point when it brings usable quotes with a newer time. An order fill with a newer time also moves it.",
};

for (const locale of locales) {
  test(`explains the snapshot cutoff in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      historyEndText(
        { kind: "snapshot" },
        { kind: "owner", classId: 7 as ClassId },
      ),
    ).toBe(snapshotTexts[locale]);
  });
}

test("dates a cash-only endpoint from the complete sale when every holding quote has left the valuation", async () => {
  const fixture = await tradedPortfolioForTest();
  const { database, owner } = fixture;
  saveDailyHistory(database, recordedIhsgForTest(["2026-11-03"]));
  saveDailyHistory(database, recordedBbcaForTest(["2026-11-03"]));
  saveQuotes(database, [quote], new Date("2026-11-03T03:01:00Z"));
  const now = new Date("2026-11-03T03:05:00Z");
  placedOrderForTest(
    database,
    owner,
    saleForTest({ lots: orderLotsForTest(100), placedAt: now }),
  );
  checkPortfolioOrders(
    database,
    storedPortfolioIdForTest(database, owner),
    now,
  );
  const report = reportAt(fixture, now);
  expect(report.valuation.holdings).toEqual([]);
  // Python Decimal gives 48,529,600 + 48,400,000 - 72,600 - 48,400 = 96,808,600, and 96,808,600 / 100,000,000 - 1 = -0.031914.
  expect(report.valuation.total?.value).toBe(96_808_600);
  expect(report.history.ok).toBe(true);
  if (!report.history.ok) throw new Error("The fixture has a calendar.");
  expect(report.history.value.points.at(-1)).toEqual({
    date: "2026-11-03",
    measuredAt: now,
    portfolio: closeToForTest(-0.031914, 15),
    market: closeToForTest(-0.03020733431546059, 15),
  });
});

function reportAt(
  { database, owner }: Awaited<ReturnType<typeof tradedPortfolioForTest>>,
  now: Date,
) {
  return readPortfolioReport(
    database,
    {
      portfolio: readPortfolio(database, owner),
      startingCash: owner.startingCash,
      joinedAt: duringSessionForTest,
    },
    { now, delayMinutes: 10 },
  );
}

for (const [now, beforeClose] of [
  ["2026-10-30T10:30:00Z", true],
  ["2026-10-30T10:30:00Z", false],
  ["2026-10-31T03:00:00Z", false],
  ["2026-11-01T03:00:00Z", false],
] as const) {
  test(`checks cash against the base close at ${now} with ${beforeClose ? "an earlier" : "the recorded closing"} quote`, async () => {
    const { database } = await tradedPortfolioForTest();
    saveDailyHistory(
      database,
      recordedIhsgForTest(["2026-11-02", "2026-11-03"]),
    );
    const answer = await fixturePriceSource.fetchQuotes(
      [{ kind: "index", code: "IHSG" }],
      new AbortController().signal,
    );
    if (!answer.ok) throw new Error(answer.failure);
    const closing = answer.value.quotes.find((price) => price.kind === "index");
    if (closing === undefined)
      throw new Error("The fixture source records the IHSG close.");
    expect(closing.quotedAt).toEqual(new Date("2026-10-30T09:00:05Z"));
    // The earlier timestamp isolates a failed update that left an intraday quote of the base day.
    const quote = beforeClose
      ? { ...closing, quotedAt: new Date("2026-10-30T04:00:00Z") }
      : closing;
    saveQuotes(database, [quote], new Date("2026-10-30T09:10:05Z"));
    const report = readPortfolioReport(
      database,
      {
        portfolio: { cash: rupiah(100_000_000), holdings: [], orders: [] },
        startingCash: rupiah(100_000_000),
        joinedAt: new Date("2026-10-30T10:00:00Z"),
      },
      { now: new Date(now), delayMinutes: fixturePriceSource.delayMinutes },
    );
    // By hand, 5,057.05 / 5,057.05 - 1 and cash / starting cash - 1 are both zero.
    expect(report.market?.return).toBe(beforeClose ? undefined : 0);
    expect(report.history.ok).toBe(true);
    if (!report.history.ok) throw new Error("The fixture has a closing day.");
    expect(report.history.value.points[0]).toEqual({
      date: "2026-10-30",
      portfolio: 0,
      market: 0,
    });
    expect(report.history.value.points).toHaveLength(beforeClose ? 1 : 2);
    if (!beforeClose)
      expect(report.history.value.points.at(-1)).toEqual({
        date: "2026-10-30",
        measuredAt: closing.quotedAt,
        portfolio: 0,
        market: 0,
      });
  });
}

test("keeps calendar recovery ahead of the snapshot cutoff", () => {
  // Invented future levels isolate the end of calendar coverage. By hand, cash has a return of zero and 101 / 100 - 1 is 0.01.
  const start = historyStartDate(new Date("2027-12-29T03:00:00Z"));
  expect(start.ok).toBe(true);
  if (!start.ok) throw new Error("The fixture joins within calendar coverage.");
  const input = {
    startingCash: rupiah(100_000_000),
    startDate: start.value,
    orders: [],
    stocks: [],
    market: indexHistoryForTest(
      buildDailyHistory({ kind: "index", code: "IHSG" }, [
        ["2027-12-28", 100],
        ["2027-12-29", 101],
        ["2027-12-30", 102],
      ]),
    ),
    now: new Date("2027-12-30T10:00:00Z"),
    delayMinutes: 10,
  };
  const history = portfolioHistory(input);
  expect(history.end).toEqual({ kind: "missingCalendar" });
  const quote: IndexQuote = {
    kind: "index",
    code: "IHSG",
    level: indexPoints(101),
    previousLevel: indexPoints(100),
    quotedAt: new Date("2027-12-29T03:00:00Z"),
  };
  const marketReturn = marketReturnSinceStart(
    input,
    quote.level,
    quote.quotedAt,
  );
  expect(marketReturn).toEqual(closeToForTest(0.01, 15));
  if (marketReturn === undefined)
    throw new Error("The fixture has its market return.");
  const current = currentReturnHistory(history, {
    valuation: valuePortfolio(
      { cash: input.startingCash, holdings: [] },
      input.startingCash,
      new Map<string, StockQuote>(),
    ),
    market: { quote, return: marketReturn },
    orders: [],
  });
  expect(current.end).toEqual({ kind: "missingCalendar" });
  expect(current.points.at(-1)).toEqual({
    date: "2027-12-29",
    measuredAt: quote.quotedAt,
    portfolio: 0,
    market: closeToForTest(0.01, 15),
  });
});
