import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import { defaultEstimationSettings } from "./estimation-settings";
import { measureStock } from "./measure-stock";
import { monthEndClosesForTest } from "./month-end-closes-for-test";
import { sumOfDeviationProducts, sumOfReturns } from "./return-statistics";

// The expected sums were computed with the decimal module of Python at 50 significant digits, from the month-end closes in month-end-closes-for-test.ts over the 60 monthly returns from October 2021 to September 2026, as measure-stock.test.ts measures BBCA. Python divided each sum by 60, or by 59 for the products of deviations, and got the expected return, the variance, and the covariance with the IHSG that measure-stock.test.ts gives.
function bbcaAndIhsg() {
  const { stock, market } = successValueForTest(
    measureStock(
      monthEndClosesForTest("BBCA"),
      monthEndClosesForTest("IHSG"),
      defaultEstimationSettings,
    ),
    "BBCA has enough monthly returns",
  );
  return {
    stock: {
      returns: stock.returns.map((measure) => measure.value),
      mean: stock.expectedReturn.value,
    },
    market: {
      returns: market.returns.map((measure) => measure.value),
      mean: market.expectedReturn.value,
    },
  };
}

test("adds up the monthly returns that an expected return divides by their number", () => {
  const { stock, market } = bbcaAndIhsg();
  expect(stock.returns).toHaveLength(60);
  expect(sumOfReturns(stock.returns)).toBeCloseTo(-0.06135891505198615, 15);
  expect(sumOfReturns(market.returns)).toBeCloseTo(0.02741045532307793, 15);
  expect(sumOfReturns(stock.returns) / stock.returns.length).toBeCloseTo(
    stock.mean,
    16,
  );
});

test("adds up the squared deviations of one series and the products of the deviations of two series over the same months", () => {
  const { stock, market } = bbcaAndIhsg();
  expect(sumOfDeviationProducts(stock, stock)).toBeCloseTo(
    0.1612101739224967,
    15,
  );
  expect(sumOfDeviationProducts(market, market)).toBeCloseTo(
    0.12089976615130019,
    15,
  );
  expect(sumOfDeviationProducts(stock, market)).toBeCloseTo(
    0.08334484051949176,
    15,
  );
});

test("fails when two series of returns cover different months, which alignedReturns never gives", () => {
  const { stock, market } = bbcaAndIhsg();
  expect(() =>
    sumOfDeviationProducts(stock, {
      returns: market.returns.slice(1),
      mean: market.mean,
    }),
  ).toThrow(
    "A covariance needs returns over the same months, but one instrument has 60 returns and the other has 59.",
  );
});
