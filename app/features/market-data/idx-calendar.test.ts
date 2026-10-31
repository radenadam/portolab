import { expect, test } from "vitest";
import { isPriceUpdateTime, isTradingDay } from "./idx-calendar";

test("a friday in november is a trading day", () => {
  expect(isTradingDay(new Date("2026-11-06T03:00:00Z"))).toBe(true);
});

test("weekends are not trading days", () => {
  expect(isTradingDay(new Date("2026-10-31T03:00:00Z"))).toBe(false);
  expect(isTradingDay(new Date("2026-11-01T03:00:00Z"))).toBe(false);
});

test("exchange holidays are not trading days", () => {
  expect(isTradingDay(new Date("2026-12-24T03:00:00Z"))).toBe(false);
  expect(isTradingDay(new Date("2027-03-10T03:00:00Z"))).toBe(false);
});

test("the trading day follows the date in WIB, not in UTC", () => {
  // 18:00 UTC on Thursday 31 December 2026 is 01:00 WIB on Friday 1 January 2027, a holiday.
  expect(isTradingDay(new Date("2026-12-31T18:00:00Z"))).toBe(false);
  // 20:00 UTC on Sunday 1 November 2026 is 03:00 WIB on Monday 2 November 2026.
  expect(isTradingDay(new Date("2026-11-01T20:00:00Z"))).toBe(true);
});

test("prices update from 08:45 to 16:25 WIB on a trading day", () => {
  expect(isPriceUpdateTime(new Date("2026-11-02T01:44:00Z"))).toBe(false);
  expect(isPriceUpdateTime(new Date("2026-11-02T01:45:00Z"))).toBe(true);
  expect(isPriceUpdateTime(new Date("2026-11-02T09:25:00Z"))).toBe(true);
  expect(isPriceUpdateTime(new Date("2026-11-02T09:26:00Z"))).toBe(false);
});

test("prices do not update on a holiday during market hours", () => {
  expect(isPriceUpdateTime(new Date("2026-12-25T03:00:00Z"))).toBe(false);
});
