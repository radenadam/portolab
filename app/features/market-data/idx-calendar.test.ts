import { expect, test } from "vitest";
import { isPriceUpdateTime, isSameWibDay } from "./idx-calendar";

// 03:00 UTC is 10:00 WIB, inside the trading hours, so these answers depend only on the day.

test("counts a Friday in November as a trading day", () => {
  expect(isPriceUpdateTime(new Date("2026-11-06T03:00:00Z"))).toEqual({
    ok: true,
    value: true,
  });
});

test("excludes weekends from trading days", () => {
  expect(isPriceUpdateTime(new Date("2026-10-31T03:00:00Z"))).toEqual({
    ok: true,
    value: false,
  });
  expect(isPriceUpdateTime(new Date("2026-11-01T03:00:00Z"))).toEqual({
    ok: true,
    value: false,
  });
});

test("excludes exchange holidays from trading days", () => {
  expect(isPriceUpdateTime(new Date("2026-12-24T03:00:00Z"))).toEqual({
    ok: true,
    value: false,
  });
  expect(isPriceUpdateTime(new Date("2027-03-10T03:00:00Z"))).toEqual({
    ok: true,
    value: false,
  });
});

test("updates prices from 08:45 to 16:25 WIB on a trading day", () => {
  expect(isPriceUpdateTime(new Date("2026-11-02T01:44:00Z"))).toEqual({
    ok: true,
    value: false,
  });
  expect(isPriceUpdateTime(new Date("2026-11-02T01:45:00Z"))).toEqual({
    ok: true,
    value: true,
  });
  expect(isPriceUpdateTime(new Date("2026-11-02T09:25:00Z"))).toEqual({
    ok: true,
    value: true,
  });
  expect(isPriceUpdateTime(new Date("2026-11-02T09:26:00Z"))).toEqual({
    ok: true,
    value: false,
  });
});

test("skips price updates on a holiday during market hours", () => {
  expect(isPriceUpdateTime(new Date("2026-12-25T03:00:00Z"))).toEqual({
    ok: true,
    value: false,
  });
});

test("fails for a date that no calendar covers and names the date", () => {
  expect(isPriceUpdateTime(new Date("2028-01-03T03:00:00Z"))).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2028-01-03, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
  expect(isPriceUpdateTime(new Date("2025-12-31T03:00:00Z"))).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2025-12-31, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
});

test("compares days in WIB, not in UTC", () => {
  // 18:00 UTC on 30 October 2026 is 01:00 WIB on 31 October, a day after 09:00 UTC on 30 October.
  expect(
    isSameWibDay(
      new Date("2026-10-30T09:00:00Z"),
      new Date("2026-10-30T18:00:00Z"),
    ),
  ).toBe(false);
  expect(
    isSameWibDay(
      new Date("2026-10-30T02:00:00Z"),
      new Date("2026-10-30T16:00:00Z"),
    ),
  ).toBe(true);
});
