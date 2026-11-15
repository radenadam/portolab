import { expect, test } from "vitest";
import {
  listIndexHistory,
  listStockHistory,
  saveDailyHistory,
} from "~/features/market-data/history-store.server";
import { saveQuotes } from "~/features/market-data/quote-store.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import type {
  ClosePrice,
  DailyClose,
} from "~/features/market-data/price-source.server";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { successValueForTest } from "~/success-value-for-test";
import { succeed } from "~/result";
import { shares } from "~/units/shares";
import { tradePortfolioForTest } from "./trade-portfolio-for-test.server";
import { readTradePortfolio } from "./read-trade-portfolio.server";
import { previewTrade } from "./preview-trade";
import {
  purchaseForTest,
  saleForTest,
  limitForTest,
  duringSessionForTest,
  orderLotsForTest,
} from "./orders-for-test";

// The recorded month-end closes remain unchanged, so the independent values in preview-trade.test.ts still apply. Invented earlier days exercise daily storage without adding a new month end.
function withEarlierDays<Price extends ClosePrice>(
  closes: readonly DailyClose<Price>[],
): DailyClose<Price>[] {
  return closes.flatMap((close) => [
    ...Array.from({ length: 20 }, (_value, index) => ({
      date: `${close.date.slice(0, 8)}${String(index + 1).padStart(2, "0")}`,
      close: close.close,
    })),
    close,
  ]);
}

test("bounds a ten-holding preview by the monthly window while preserving the full-history results", async () => {
  const { database, portfolio, ticket } = await tradePortfolioForTest();
  const stockHistory = listStockHistory(database, "BBCA");
  const market = listIndexHistory(database, "IHSG");
  const codes = [
    "BBCA",
    "TLKM",
    "ASII",
    "BMRI",
    "BBNI",
    "BBRI",
    "UNTR",
    "AMMN",
    "ADRO",
    "ANTM",
  ];
  if (ticket.quote === undefined)
    throw new Error("BBCA has its recorded quote.");
  const quote = ticket.quote;
  const day = successValueForTest(
    ticket.day,
    "The trading day has recorded rules",
  );
  for (const code of codes)
    saveDailyHistory(database, {
      ...stockHistory,
      code,
      closes: withEarlierDays(stockHistory.closes),
    });
  saveDailyHistory(database, {
    ...market,
    closes: withEarlierDays(market.closes),
  });
  saveQuotes(
    database,
    codes.map((code) => stockQuote(code, [4980, 4940], "2026-10-30T09:14:55Z")),
    duringSessionForTest,
  );
  const compact = successValueForTest(
    readTradePortfolio(
      database,
      {
        ...portfolio,
        holdings: codes.map((code) => ({
          ...portfolio.holdings[0],
          code,
          shares: shares(100),
          cost: quote.price,
        })),
      },
      {
        code: "BBCA",
        now: duringSessionForTest,
        day: succeed({ ...day, previousDate: "2026-10-29" }),
      },
    ),
    "Every invented holding has its quote",
  );
  const full = {
    ...compact,
    stocks: compact.stocks.map((stock) => ({
      ...stock,
      ...listStockHistory(database, stock.code),
    })),
    market: listIndexHistory(database, "IHSG"),
  };
  const count = defaultEstimationSettings.returnCount;
  expect(compact.market.closes.length).toBeLessThanOrEqual(count + 2);
  for (const stock of compact.stocks) {
    expect(stock.closes.length).toBeLessThanOrEqual(count + 3);
    expect(stock.closes.some((close) => close.date === "2026-10-01")).toBe(
      false,
    );
  }
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(
    Buffer.byteLength(JSON.stringify(full)) / 10,
  );
  for (const request of [
    purchaseForTest(),
    purchaseForTest({ price: limitForTest(5000) }),
    saleForTest({ lots: orderLotsForTest(1) }),
  ]) {
    expect(
      previewTrade(compact, request, { day, quote: ticket.quote }),
    ).toEqual(previewTrade(full, request, { day, quote: ticket.quote }));
  }
});

test("keeps the selected stock's reference close and the latest close needed for a missing-return forecast", async () => {
  const { database, portfolio, ticket } = await tradePortfolioForTest("AADI");
  const day = successValueForTest(ticket.day, "The day has recorded rules");
  const bbca = listStockHistory(database, "BBCA");
  const first = bbca.closes[0];
  if (first === undefined) throw new Error("BBCA has its recorded closes.");
  saveDailyHistory(database, {
    ...bbca,
    closes: [{ date: "2026-10-29", close: first.close }],
  });
  const compact = successValueForTest(
    readTradePortfolio(database, portfolio, {
      code: "BBCA",
      now: duringSessionForTest,
      day: succeed({ ...day, previousDate: "2026-10-29" }),
    }),
    "The portfolio is priced",
  );
  expect(
    compact.stocks.find((stock) => stock.code === "BBCA")?.closes,
  ).toContainEqual({ date: "2026-10-29", close: first.close });
  const aadi = successValueForTest(ticket.impact, "AADI has its quote");
  const full = {
    ...aadi,
    stocks: aadi.stocks.map((stock) => ({
      ...stock,
      ...listStockHistory(database, stock.code),
    })),
    market: listIndexHistory(database, "IHSG"),
  };
  const request = purchaseForTest({ code: "AADI" });
  const options = {
    day: successValueForTest(ticket.day, "The day has rules"),
    quote: ticket.quote,
  };
  const preview = previewTrade(aadi, request, options);
  expect(preview).toMatchObject({
    ok: false,
    failure: {
      kind: "order",
      failure: {
        kind: "tooFewReturns",
        count: 21,
        enoughAfterFirstTradingDayOf: "2027-01-01",
      },
    },
  });
  expect(preview).toEqual(previewTrade(full, request, options));
});
