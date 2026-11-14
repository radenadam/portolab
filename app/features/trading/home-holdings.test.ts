import { expect, test } from "vitest";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { stockQuote } from "~/features/market-data/stock-quote";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { homeHoldings } from "./home-holdings";
import { valuePortfolio } from "./value-portfolio";

// Python Decimal at 50 significant digits computed the values from the recorded 3 November 2026 quote of BBCA, Rp4,840 against Rp4,980, and the cost and cash of value-portfolio.test.ts.
const holding = {
  code: "BBCA",
  shares: shares(10_000),
  cost: rupiah(49_874_700),
};
const quote = stockQuote("BBCA", [4_840, 4_980], "2026-11-03T02:55:00Z");
const cash = rupiah(48_529_600);
const startingCash = rupiah(100_000_000);

test("computes average cost and weights including cash", () => {
  const valuation = valuePortfolio(
    { cash, holdings: [holding] },
    startingCash,
    new Map([[quote.code, quote]]),
  );
  expect(valuation.total?.value).toBe(96_929_600);
  expect(valuation.holdings[0]).toMatchObject({
    value: 48_400_000,
    gain: -1_474_700,
    gainReturn: closeToForTest(-0.029568097652717711, 15),
  });
  const result = homeHoldings(valuation);
  expect(result.holdings[0]).toMatchObject({
    averageCost: 4_987,
    weight: closeToForTest(0.4993314735643188, 15),
  });
  expect(result.cashWeight).toBeCloseTo(0.5006685264356812, 15);
});

test("withholds every weight when a holding has no quote", () => {
  const valuation = valuePortfolio(
    { cash, holdings: [holding] },
    startingCash,
    new Map(),
  );
  expect(valuation.unpricedCodes).toEqual(["BBCA"]);
  expect(homeHoldings(valuation)).toMatchObject({
    cashWeight: undefined,
    holdings: [{ averageCost: 4_987, weight: undefined }],
  });
});

test("weighs cash alone after every holding has been sold", () => {
  const valuation = valuePortfolio(
    { cash, holdings: [] },
    startingCash,
    new Map(),
  );
  expect(homeHoldings(valuation)).toEqual({
    holdings: [],
    cashWeight: 1,
  });
});
