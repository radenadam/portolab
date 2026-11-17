import { expect, test } from "vitest";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { saveFixtureHistoryForTest } from "~/features/market-data/save-fixture-history-for-test.server";
import { deleteStockClosesBeforeForTest } from "~/features/market-data/delete-stock-closes-before-for-test.server";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { successValueForTest } from "~/success-value-for-test";
import { tradePortfolioForTest } from "./trade-portfolio-for-test.server";
import { readTradePortfolio } from "./read-trade-portfolio.server";
import { readTicket } from "./read-ticket.server";
import type { TradePortfolio } from "./preview-trade";
import { previewTrade } from "./preview-trade";
import {
  purchaseForTest,
  saleForTest,
  limitForTest,
  duringSessionForTest,
  orderLotsForTest,
} from "./orders-for-test";

test("bounds recorded daily histories by the monthly window while preserving accepted previews", async () => {
  const { database, portfolio, ticket } = await tradePortfolioForTest();
  saveFixtureHistoryForTest(database, []);
  const day = successValueForTest(
    ticket.day,
    "The trading day has recorded rules",
  );
  expect(day.previousDate).toBe("2026-10-30");
  const compact = successValueForTest(
    readTradePortfolio(database, portfolio, {
      code: "BBCA",
      now: duringSessionForTest,
      day: ticket.day,
    }),
    "The recorded holdings have their quotes",
  );
  const full = withFullHistory(compact, database);
  const count = defaultEstimationSettings.returnCount;
  expect(full.market.closes.length).toBeGreaterThan(count + 2);
  expect(compact.market.closes.length).toBeLessThanOrEqual(count + 2);
  for (const stock of compact.stocks) {
    expect(stock.closes.length).toBeLessThanOrEqual(count + 2);
    expect(stock.closes.some((close) => close.date === "2026-10-26")).toBe(
      false,
    );
  }
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(full)),
  );
  const selected = compact.stocks.find((stock) => stock.code === "BBCA");
  expect(selected?.closes).toContainEqual({ date: "2026-10-30", close: 4980 });
  for (const request of [
    purchaseForTest(),
    purchaseForTest({ price: limitForTest(5000) }),
    saleForTest({ lots: orderLotsForTest(1) }),
  ]) {
    const preview = previewTrade(compact, request, {
      day,
      quote: ticket.quote,
    });
    expect(preview.ok).toBe(true);
    expect(preview).toEqual(
      previewTrade(full, request, { day, quote: ticket.quote }),
    );
  }
});

test("keeps the latest closes for a forecast after older history of a held stock is deleted", async () => {
  const { database, portfolio } = await tradePortfolioForTest("TLKM");
  saveFixtureHistoryForTest(database, []);
  // An operator can delete older closes after a holding was bought, so a healthy purchase can still leave the portfolio without measures.
  deleteStockClosesBeforeForTest(database, "BBCA", "2026-10-26");
  const ticket = readTicket(database, portfolio, {
    code: "TLKM",
    now: duringSessionForTest,
    delayMinutes: fixturePriceSource.delayMinutes,
  });
  const compact = successValueForTest(
    ticket.impact,
    "The holdings have their quotes",
  );
  const full = withFullHistory(compact, database);
  expect(
    full.stocks.find((stock) => stock.code === "BBCA")?.closes,
  ).toHaveLength(5);
  expect(compact.stocks.find((stock) => stock.code === "BBCA")?.closes).toEqual(
    [{ date: "2026-10-30", close: 4980 }],
  );
  expect(compact.market.closes.at(-1)?.date).toBe("2026-10-30");
  expect(
    compact.stocks.find((stock) => stock.code === "TLKM")?.buyable.ok,
  ).toBe(true);
  const request = purchaseForTest({ code: "TLKM" });
  const options = {
    day: successValueForTest(ticket.day, "The day has recorded rules"),
    quote: ticket.quote,
  };
  const preview = previewTrade(compact, request, options);
  // No return has both month-end closes. The 24 changes from November 2026 through October 2028 become final in November 2028.
  expect(preview).toMatchObject({
    ok: false,
    failure: {
      kind: "measures",
      failure: {
        kind: "tooFewReturns",
        code: "BBCA",
        count: 0,
        minimum: 24,
        enoughAfterFirstTradingDayOf: { ok: true, value: "2028-11-01" },
      },
    },
  });
  expect(preview).toEqual(previewTrade(full, request, options));
});

function withFullHistory(
  compact: TradePortfolio,
  database: Parameters<typeof listStockHistory>[0],
): TradePortfolio {
  return {
    ...compact,
    stocks: compact.stocks.map((stock) => ({
      ...stock,
      ...listStockHistory(database, stock.code),
    })),
    market: listIndexHistory(database, "IHSG"),
  };
}
