import { expect, test } from "vitest";
import type { EstimationSettings } from "./estimation-settings";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import { measureStock } from "./stock-measures";

// The expected values were computed with the decimal module of Python at 50 significant digits, from the month-end closes in month-end-closes-for-test.ts and a BI-Rate of 5.75%, which Bank Indonesia announced on 18 June 2026. October 2026 is the month of the latest close, so the window ends on 30 September 2026.
const settings: EstimationSettings = {
  frequency: "monthly",
  returnCount: 60,
  minimumReturnCount: 24,
};
const ihsg = monthEndClosesForTest("IHSG");

test("measures a stock against the IHSG over the latest 60 monthly returns", () => {
  const measures = measureStock(monthEndClosesForTest("BBCA"), ihsg, settings);
  if (!measures.ok) {
    throw new Error("BBCA has 60 monthly returns.");
  }
  const { stock, market } = measures.value;
  expect(stock.code).toBe("BBCA");
  expect(stock.series.returns).toHaveLength(60);
  // BBCA split each share into five on 13 October 2021, so its close of September 2021 is a fifth of the price of that day.
  expect(stock.series.returns[0]).toEqual({
    formula: "priceChange",
    value: expect.closeTo(0.06785714285714285, 16) as number,
    inputs: {
      startDate: "2021-09-30",
      startClose: 7000,
      endDate: "2021-10-29",
      endClose: 7475,
    },
  });
  expect(stock.series.returns.at(-1)?.value).toBeCloseTo(
    -0.06177606177606178,
    16,
  );
  expect(stock.series.expectedReturn.formula).toBe("mean");
  expect(stock.series.expectedReturn.inputs.returns).toHaveLength(60);
  expect(stock.series.expectedReturn.value).toBeCloseTo(
    -0.0010226485841997692,
    16,
  );
  expect(stock.series.variance.formula).toBe("sampleVariance");
  expect(stock.series.variance.value).toBeCloseTo(0.0027323758291948595, 16);
  expect(stock.series.variance.inputs.mean).toBe(
    stock.series.expectedReturn.value,
  );
  expect(stock.series.standardDeviation).toEqual({
    formula: "squareRoot",
    value: expect.closeTo(0.05227213243397345, 15) as number,
    inputs: { variance: stock.series.variance.value },
  });
  expect(market.series.expectedReturn.value).toBeCloseTo(
    0.00045684092205129883,
    16,
  );
  expect(market.series.variance.value).toBeCloseTo(0.0020491485788355964, 16);
  expect(stock.covarianceWithMarket.formula).toBe("sampleCovariance");
  expect(stock.covarianceWithMarket.value).toBeCloseTo(
    0.0014126244155846061,
    16,
  );
  expect(stock.correlationWithMarket.formula).toBe("correlation");
  expect(stock.correlationWithMarket.value).toBeCloseTo(0.59699372491779, 14);
  expect(stock.beta).toEqual({
    formula: "beta",
    value: expect.closeTo(0.6893713956004657, 14) as number,
    inputs: {
      covarianceWithMarket: stock.covarianceWithMarket.value,
      marketVariance: market.series.variance.value,
    },
  });
  expect(market.riskFreeRate.value).toBeCloseTo(0.004791666666666666, 17);
  expect(market.riskFreeRate.inputs.announcedOn).toBe("2026-06-18");
  expect(stock.requiredReturn).toEqual({
    formula: "capm",
    value: expect.closeTo(0.0018033617934163425, 16) as number,
    inputs: {
      riskFreeRate: market.riskFreeRate.value,
      beta: stock.beta.value,
      marketExpectedReturn: market.series.expectedReturn.value,
    },
  });
  expect(stock.securityMarketLine).toEqual({
    formula: "securityMarketLineDistance",
    value: expect.closeTo(-0.002826010377616112, 16) as number,
    inputs: {
      expectedReturn: stock.series.expectedReturn.value,
      requiredReturn: stock.requiredReturn.value,
    },
  });
});

test("measures a stock with a shorter history over the months that it shares with the IHSG", () => {
  // AMMN listed in July 2023, so its first monthly return is that of August 2023.
  const measures = measureStock(monthEndClosesForTest("AMMN"), ihsg, settings);
  if (!measures.ok) {
    throw new Error("AMMN has 38 monthly returns.");
  }
  const { stock, market } = measures.value;
  expect(stock.series.returns).toHaveLength(38);
  expect(
    market.series.returns.map((measure) => measure.inputs.endDate),
  ).toEqual(stock.series.returns.map((measure) => measure.inputs.endDate));
  expect(stock.series.expectedReturn.value).toBeCloseTo(
    0.028220485911893658,
    16,
  );
  expect(stock.series.standardDeviation.value).toBeCloseTo(
    0.18429693326878036,
    15,
  );
  expect(market.series.expectedReturn.value).toBeCloseTo(
    -0.002012279107748291,
    16,
  );
  expect(stock.beta.value).toBeCloseTo(1.110656361185523, 14);
  expect(stock.requiredReturn.value).toBeCloseTo(-0.002765178988848664, 16);
  expect(stock.securityMarketLine.value).toBeCloseTo(0.03098566490074232, 16);
});

test("fails for a stock with fewer monthly returns than the minimum", () => {
  // AADI listed in December 2024, so the window holds 21 of its monthly returns.
  expect(measureStock(monthEndClosesForTest("AADI"), ihsg, settings)).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "AADI", count: 21, minimum: 24 },
  });
});
