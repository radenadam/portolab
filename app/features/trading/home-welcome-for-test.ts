import { databaseWithClosesForTest } from "~/features/measures/measures-for-test.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { saveQuotes } from "~/features/market-data/quote-store.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { successValueForTest } from "~/success-value-for-test";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { rupiah } from "~/units/rupiah";
import { valuePortfolio } from "./value-portfolio";
import { homePortfolioForTest } from "./home-portfolio-for-test";
import { readPortfolioReport } from "./read-portfolio-report.server";
import { readHomeWelcome } from "./read-home-welcome.server";
import type { Portfolio } from "./portfolio-store.server";
import { and, gte, lt } from "drizzle-orm";
import { indexDailyCloses } from "~/features/market-data/market-data.schema";

/** A nondefault class balance catches a welcome that accidentally states the default cash. */
export async function homeWelcomeForTest(
  mapAvailable = true,
  peers: 0 | 1 | 2 = 0,
  recentCloses?: 0 | 1,
) {
  const database = databaseWithClosesForTest();
  const now = new Date("2026-10-30T10:00:00Z");
  const startingCash = rupiah(125_000_000);
  const portfolio: Portfolio = { cash: startingCash, holdings: [], orders: [] };
  if (recentCloses !== undefined) {
    database
      .delete(indexDailyCloses)
      .where(
        and(
          gte(indexDailyCloses.date, "2026-07-30"),
          recentCloses === 1
            ? lt(indexDailyCloses.date, "2026-10-30")
            : undefined,
        ),
      )
      .run();
  }
  if (mapAvailable) {
    const quotes = successValueForTest(
      await fixturePriceSource.fetchQuotes(
        [marketIndex],
        AbortSignal.timeout(1_000),
      ),
      "Read the recorded IHSG quote",
    );
    saveQuotes(database, quotes.quotes, now);
  }
  const report = readPortfolioReport(
    database,
    { portfolio, startingCash, joinedAt: now },
    { now, delayMinutes: fixturePriceSource.delayMinutes },
  );
  const home = homePortfolioForTest(
    valuePortfolio(portfolio, startingCash, new Map()),
    now,
  );
  home.report = report;
  home.setAside = { amount: rupiah(0), orders: 0 };
  home.delayMinutes = fixturePriceSource.delayMinutes;
  home.classmates = [
    { beta: beta(0.8), return: cumulativeReturn(0.01) },
    { beta: beta(1.1), return: cumulativeReturn(-0.02) },
  ].slice(0, peers);
  const welcome = readHomeWelcome(database, { portfolio, startingCash, now });
  if (welcome === undefined)
    throw new Error("The empty portfolio has no welcome.");
  return { home, welcome };
}
