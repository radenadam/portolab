import { expect, test } from "vitest";
import { defaultEstimationSettings } from "./estimation-settings";
import { forecastEnoughReturns } from "./forecast-enough-returns";
import { marketWithoutCompleteMonthForTest } from "./market-without-complete-month-for-test";
import { monthEndClosesForTest } from "./month-end-closes-for-test";

const ihsg = monthEndClosesForTest("IHSG");
const twelveReturns = { returnCount: 12, minimumReturnCount: 12 };

function withoutClose(code: "BBCA" | "TLKM", date: string) {
  const history = monthEndClosesForTest(code);
  return {
    code,
    closes: history.closes.filter((close) => close.date !== date),
  };
}

test("names the first trading day that completes the month that brings a stock that listed recently enough returns", () => {
  // AADI has 21 returns in the window that ends in September 2026, so the returns of October, November, and December 2026 bring 24, and the first trading day of January 2027 completes December.
  expect(
    forecastEnoughReturns(
      [monthEndClosesForTest("AADI")],
      ihsg,
      defaultEstimationSettings,
    ),
  ).toEqual({ ok: true, value: "2027-01-01" });
});

test("waits until the window has passed the latest month that any instrument lacks", () => {
  // The window of 12 returns that ends in September 2026 starts with October 2025. Without its close of 30 June 2026, BBCA lacks the returns of June and July 2026, and without its close of 31 March 2026, TLKM lacks those of March and April 2026. Each later month pushes the oldest month out, so the window first holds 12 shared months once it starts with August 2026 and ends with July 2027, which the first trading day of August 2027 completes. TLKM alone has 12 once the window starts with May 2026 and ends with April 2027.
  const bbca = withoutClose("BBCA", "2026-06-30");
  const tlkm = withoutClose("TLKM", "2026-03-31");
  expect(forecastEnoughReturns([bbca, tlkm], ihsg, twelveReturns)).toEqual({
    ok: true,
    value: "2027-08-01",
  });
  expect(forecastEnoughReturns([tlkm], ihsg, twelveReturns)).toEqual({
    ok: true,
    value: "2027-05-01",
  });
});

test("fails and names the market while it has no complete month", () => {
  expect(
    forecastEnoughReturns(
      [monthEndClosesForTest("BBCA")],
      marketWithoutCompleteMonthForTest(),
      defaultEstimationSettings,
    ),
  ).toEqual({ ok: false, failure: { code: "IHSG" } });
});

test("fails and names an instrument without a stored close", () => {
  expect(
    forecastEnoughReturns(
      [monthEndClosesForTest("BBCA"), { code: "ADMR", closes: [] }],
      ihsg,
      defaultEstimationSettings,
    ),
  ).toEqual({ ok: false, failure: { code: "ADMR" } });
});
