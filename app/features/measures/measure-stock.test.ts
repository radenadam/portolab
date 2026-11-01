import { expect, test } from "vitest";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { MarketMeasures, StockMeasures } from "./capm";
import { closeToForTest } from "./close-to-for-test";
import { defaultEstimationSettings } from "./estimation-settings";
import { measureStock } from "./measure-stock";
import { monthEndClosesForTest } from "./month-end-closes-for-test";

// The expected values were computed with the decimal module of Python at 50 significant digits, from the month-end closes in month-end-closes-for-test.ts and a BI-Rate of 5.75%, which Bank Indonesia announced on 18 June 2026. October 2026 is the month of the latest close, so the window ends on 30 September 2026.
const ihsg = monthEndClosesForTest("IHSG");

function measured(code: "BBCA" | "AMMN"): {
  stock: StockMeasures;
  market: MarketMeasures;
} {
  const measures = measureStock(
    monthEndClosesForTest(code),
    ihsg,
    defaultEstimationSettings,
  );
  if (!measures.ok) {
    throw new Error(
      `${code} has enough monthly returns, but its measures failed with ${JSON.stringify(measures.failure)}.`,
    );
  }
  return measures.value;
}

test("measures a stock against the IHSG over the latest 60 monthly returns", () => {
  const { stock, market } = measured("BBCA");
  expect(stock.code).toBe("BBCA");
  expect(stock.returns).toHaveLength(60);
  // BBCA split each share into five on 13 October 2021, so its close of September 2021 is a fifth of the price of that day.
  expect(stock.returns[0]).toEqual({
    formula: "priceChange",
    value: closeToForTest(0.06785714285714285, 16),
    inputs: {
      startDate: "2021-09-30",
      startClose: 7000,
      endDate: "2021-10-29",
      endClose: 7475,
    },
  });
  expect(stock.returns.at(-1)?.value).toBeCloseTo(-0.06177606177606178, 16);
  expect(stock.expectedReturn.formula).toBe("mean");
  expect(stock.expectedReturn.inputs.returns).toHaveLength(60);
  expect(stock.expectedReturn.value).toBeCloseTo(-0.0010226485841997692, 16);
  expect(stock.variance.formula).toBe("sampleVariance");
  expect(stock.variance.value).toBeCloseTo(0.0027323758291948595, 16);
  expect(stock.variance.inputs.mean).toBe(stock.expectedReturn.value);
  expect(stock.standardDeviation).toEqual({
    formula: "squareRoot",
    value: closeToForTest(0.05227213243397345, 15),
    inputs: { variance: stock.variance.value },
  });
  expect(market.expectedReturn.value).toBeCloseTo(0.00045684092205129883, 16);
  expect(market.variance.value).toBeCloseTo(0.0020491485788355964, 16);
  expect(stock.covarianceWithMarket.formula).toBe("sampleCovariance");
  expect(stock.covarianceWithMarket.value).toBeCloseTo(
    0.0014126244155846061,
    16,
  );
  expect(stock.correlationWithMarket.formula).toBe("correlation");
  expect(stock.correlationWithMarket.value).toBeCloseTo(0.59699372491779, 14);
  expect(stock.beta).toEqual({
    formula: "beta",
    value: closeToForTest(0.6893713956004657, 14),
    inputs: {
      covarianceWithMarket: stock.covarianceWithMarket.value,
      marketVariance: market.variance.value,
    },
  });
  expect(market.riskFreeRate.value).toBeCloseTo(0.004791666666666666, 17);
  expect(market.riskFreeRate.inputs.announcedOn).toBe("2026-06-18");
  expect(stock.requiredReturn).toEqual({
    formula: "capm",
    value: closeToForTest(0.0018033617934163425, 16),
    inputs: {
      riskFreeRate: market.riskFreeRate.value,
      beta: stock.beta.value,
      marketExpectedReturn: market.expectedReturn.value,
    },
  });
  expect(stock.securityMarketLine).toEqual({
    formula: "securityMarketLineDistance",
    value: closeToForTest(-0.002826010377616112, 16),
    inputs: {
      expectedReturn: stock.expectedReturn.value,
      requiredReturn: stock.requiredReturn.value,
    },
  });
});

test("measures a stock with a shorter history over the months that it shares with the IHSG", () => {
  // AMMN listed in July 2023, so its first monthly return is that of August 2023.
  const { stock, market } = measured("AMMN");
  expect(stock.returns).toHaveLength(38);
  expect(market.returns.map((measure) => measure.inputs.endDate)).toEqual(
    stock.returns.map((measure) => measure.inputs.endDate),
  );
  expect(stock.expectedReturn.value).toBeCloseTo(0.028220485911893658, 16);
  expect(stock.standardDeviation.value).toBeCloseTo(0.18429693326878036, 15);
  expect(market.expectedReturn.value).toBeCloseTo(-0.002012279107748291, 16);
  expect(stock.beta.value).toBeCloseTo(1.110656361185523, 14);
  expect(stock.requiredReturn.value).toBeCloseTo(-0.002765178988848664, 16);
  expect(stock.securityMarketLine.value).toBeCloseTo(0.03098566490074232, 16);
});

test("fails for a stock with fewer monthly returns than the minimum", () => {
  // AADI listed in December 2024, so the window holds 21 of its monthly returns.
  expect(
    measureStock(
      monthEndClosesForTest("AADI"),
      ihsg,
      defaultEstimationSettings,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "AADI", count: 21, minimum: 24 },
  });
});

test("fails for a stock whose price never changed in the window, instead of dividing by its variance of zero", () => {
  const unchanged = {
    code: "BBCA",
    closes: monthEndClosesForTest("BBCA").closes.map((close) => ({
      ...close,
      close: splitAdjustedRupiah(1000),
    })),
  };
  expect(measureStock(unchanged, ihsg, defaultEstimationSettings)).toEqual({
    ok: false,
    failure: { kind: "noVariation", code: "BBCA" },
  });
});
