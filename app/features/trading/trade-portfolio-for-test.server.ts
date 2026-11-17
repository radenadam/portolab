import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { saveDailyHistory } from "~/features/market-data/history-store.server";
import { saveQuotes } from "~/features/market-data/quote-store.server";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import type { PortfolioValuation } from "./value-portfolio";
import type { Portfolio } from "./portfolio-store.server";
import { successValueForTest } from "~/success-value-for-test";
import { duringSessionForTest } from "./orders-for-test";
import { readTicket } from "./read-ticket.server";

/** The quotes and month-end closes are those recorded by the fixture source, with the same day as the placement tests. */
export async function tradePortfolioForTest(
  code = "BBCA",
  valuation: PortfolioValuation = valuationForTest(["BBCA", "TLKM"]),
) {
  const database = databaseWithClosesForTest();
  const codes = [
    ...new Set([...valuation.holdings.map((holding) => holding.code), code]),
  ];
  const quotes = successValueForTest(
    await fixturePriceSource.fetchQuotes(
      codes.map((code) => ({ kind: "stock", code })),
      new AbortController().signal,
    ),
    "The fixture records these stocks",
  );
  saveQuotes(database, quotes.quotes, duringSessionForTest);
  if (code === "ASII")
    saveDailyHistory(database, monthEndClosesForTest("ASII"));
  const portfolio: Portfolio = {
    cash: valuation.cash,
    holdings: valuation.holdings.map(({ code, shares, cost }) => ({
      code,
      shares,
      cost,
    })),
    orders: [],
  };
  const ticket = readTicket(database, portfolio, {
    code,
    now: duringSessionForTest,
    delayMinutes: fixturePriceSource.delayMinutes,
  });
  return { database, portfolio, ticket };
}
