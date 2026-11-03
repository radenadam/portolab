import { expect, test } from "vitest";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Holding } from "./holding-after-fill";
import { valuePortfolio } from "./value-portfolio";

// The cash and the holding that tradedPortfolioForTest leaves: Rp48,529,600 and 10,000 shares of BBCA that cost Rp49,874,700 after the sale took out half of the cost of Rp99,749,400. The expected values were computed with the decimal module of Python at 50 significant digits.
const bbcaHolding: Holding = {
  code: "BBCA",
  shares: shares(10_000),
  cost: rupiah(49_874_700),
};
const cash = rupiah(48_529_600);
const startingCash = rupiah(100_000_000);
// The close of Tuesday 3 November 2026, as tradedPortfolioForTest takes it for a delayed price.
const bbcaQuote = stockQuote("BBCA", [4_840, 4_980], "2026-11-03T02:55:00Z");

function quotesByCode(
  quotes: readonly StockQuote[],
): ReadonlyMap<string, StockQuote> {
  const byCode = new Map<string, StockQuote>();
  for (const quote of quotes) {
    byCode.set(quote.code, quote);
  }
  return byCode;
}

test("values each holding at its delayed price, with its gain or loss on its cost, and the total against the starting cash", () => {
  expect(
    valuePortfolio(
      { cash, holdings: [bbcaHolding] },
      startingCash,
      quotesByCode([bbcaQuote]),
    ),
  ).toEqual({
    cash,
    startingCash,
    holdings: [
      {
        ...bbcaHolding,
        kind: "priced",
        quote: bbcaQuote,
        value: 48_400_000,
        gain: -1_474_700,
        gainReturn: closeToForTest(-0.029568097652717711, 15),
      },
    ],
    unpricedCodes: [],
    total: {
      holdingsValue: 48_400_000,
      value: 96_929_600,
      return: closeToForTest(-0.030704, 15),
    },
  });
});

test("values a portfolio of cash alone at its cash", () => {
  expect(
    valuePortfolio(
      { cash: startingCash, holdings: [] },
      startingCash,
      quotesByCode([]),
    ).total,
  ).toEqual({ holdingsValue: 0, value: 100_000_000, return: 0 });
});

test("has no total while a holding has no delayed price, and names each such holding", () => {
  const tlkmHolding: Holding = {
    code: "TLKM",
    shares: shares(100),
    cost: rupiah(198_297),
  };
  const valuation = valuePortfolio(
    { cash, holdings: [bbcaHolding, tlkmHolding] },
    startingCash,
    quotesByCode([bbcaQuote]),
  );
  expect(valuation.holdings[1]).toEqual({ ...tlkmHolding, kind: "unpriced" });
  expect(valuation.unpricedCodes).toEqual(["TLKM"]);
  expect(valuation.total).toBeUndefined();
});
