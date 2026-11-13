import { expect, test } from "vitest";
import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import { closeToForTest } from "./close-to-for-test";
import { measureTreynorRatio } from "./performance-ratios";

// The expected return of the portfolio of BBCA, TLKM, and cash at weights of 0.5, 0.3, and 0.2 over the 60 monthly returns to September 2026, and the BI-Rate of 5.75% divided by 12, as the decimal module of Python computed them at 50 significant digits.
const excessReturn = {
  expectedReturn: monthlyReturn(-0.0021586726703076266),
  riskFreeRate: monthlyReturn(0.004791666666666666),
};

test("measures the Treynor ratio of a beta just above 0", () => {
  // Python divided the expected return less the risk-free rate by a beta of 0.01.
  expect(measureTreynorRatio(excessReturn, beta(0.01))).toEqual({
    ok: true,
    value: {
      formula: "treynorRatio",
      value: closeToForTest(-0.6950339336974293, 15),
      inputs: { ...excessReturn, beta: 0.01 },
    },
  });
});

test("fails for a beta of 0, such as that of cash alone, and for a beta below 0, such as that of a portfolio of a stock that moves against the IHSG", () => {
  for (const value of [0, -0.12]) {
    expect(measureTreynorRatio(excessReturn, beta(value))).toEqual({
      ok: false,
      failure: { kind: "betaNotPositive", beta: value },
    });
  }
});
