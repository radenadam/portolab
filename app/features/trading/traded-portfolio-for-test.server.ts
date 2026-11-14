import type { Database } from "~/database/database.server";
import { buildDailyHistory } from "~/features/market-data/build-daily-history";
import {
  indexHistoryForTest,
  stockHistoryForTest,
} from "~/features/market-data/history-for-test";
import type {
  IndexHistory,
  StockHistory,
} from "~/features/market-data/price-source.server";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { checkPortfolioOrders } from "./check-open-orders.server";
import { orderLotsForTest, saleForTest } from "./orders-for-test";
import type { PortfolioOwner } from "./portfolio-store.server";
import { placedOrderForTest } from "./portfolios-for-test.server";
import { purchasedPortfolioForTest } from "./purchased-portfolio-for-test.server";

/** 10:00 WIB on Tuesday 3 November 2026, in session I. */
const tuesdaySessionForTest = new Date("2026-11-03T03:00:00Z");

/** The closes of Thursday 29 October, Friday 30 October, Monday 2 November, and Tuesday 3 November 2026, as Yahoo Finance returned them on 3 November 2026, rounded to two decimals as the history job stores them. */
const recordedClosesForTest = {
  IHSG: [
    ["2026-10-29", 5098.06],
    ["2026-10-30", 5057.05],
    ["2026-11-02", 5096.83],
    ["2026-11-03", 4904.29],
  ],
  BBCA: [
    ["2026-10-29", 4940],
    ["2026-10-30", 4980],
    ["2026-11-02", 4980],
    ["2026-11-03", 4840],
  ],
} as const;

/**
 * A student who joined at 10:00 WIB on Monday 2 November 2026 with Rp100 million, bought 200 lots of BBCA with a market order at 10:00 that filled at once at the delayed price of Rp4,980 quoted at 09:50, and sold 100 lots with a market order at 10:00 WIB on Tuesday 3 November 2026 that filled at once at a delayed price of Rp4,840 quoted at 09:55. The test takes the close of Tuesday, Rp4,840, as that delayed price.
 * The purchase cost Rp99,600,000 and a broker fee of Rp149,400, which left Rp250,600 in cash. The sale brought Rp48,400,000 less a broker fee of Rp72,600 and a tax of Rp48,400, which left Rp48,529,600 in cash and 10,000 shares, as the decimal module of Python computed with ROUND_HALF_UP.
 */
export async function tradedPortfolioForTest(): Promise<{
  database: Database;
  owner: PortfolioOwner;
}> {
  const { database, owner } = await purchasedPortfolioForTest();
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([
      stockQuote("BBCA", [4_840, 4_980], "2026-11-03T02:55:00Z"),
    ]),
    { at: new Date("2026-11-03T02:56:00Z") },
  );
  placedOrderForTest(
    database,
    owner,
    saleForTest({
      lots: orderLotsForTest(100),
      placedAt: tuesdaySessionForTest,
    }),
  );
  checkPortfolioOrders(database, owner.membershipId, tuesdaySessionForTest);
  return { database, owner };
}

/** The recorded closes of the IHSG, without the dates that a test leaves out. */
export function recordedIhsgForTest(
  leftOut: readonly string[] = [],
): IndexHistory {
  return indexHistoryForTest(
    buildDailyHistory(
      { kind: "index", code: "IHSG" },
      recordedClosesForTest.IHSG.filter(([date]) => !leftOut.includes(date)),
    ),
  );
}

/** The recorded closes of BBCA, without the dates that a test leaves out. */
export function recordedBbcaForTest(
  leftOut: readonly string[] = [],
): StockHistory {
  return stockHistoryForTest(
    buildDailyHistory(
      { kind: "stock", code: "BBCA" },
      recordedClosesForTest.BBCA.filter(([date]) => !leftOut.includes(date)),
    ),
  );
}
