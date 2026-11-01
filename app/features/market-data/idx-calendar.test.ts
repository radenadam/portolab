import { expect, test } from "vitest";
import {
  isPriceUpdateTime,
  isSameWibDay,
  latestClosedTradingDay,
} from "./idx-calendar";

// The answers below were worked out by hand from the calendars in idx-calendar.ts for a source with this delay.
const delayMinutes = 10;

// 03:00 UTC is 10:00 WIB, inside the trading hours, so these answers depend only on the day.

test("counts a Friday in November as a trading day", () => {
  expect(
    isPriceUpdateTime(new Date("2026-11-06T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: true,
  });
});

test("excludes weekends from trading days", () => {
  expect(
    isPriceUpdateTime(new Date("2026-10-31T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
  expect(
    isPriceUpdateTime(new Date("2026-11-01T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
});

test("excludes exchange holidays from trading days", () => {
  expect(
    isPriceUpdateTime(new Date("2026-12-24T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
  expect(
    isPriceUpdateTime(new Date("2027-03-10T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
});

test("updates prices from 08:45 to 16:25 WIB on a trading day", () => {
  expect(
    isPriceUpdateTime(new Date("2026-11-02T01:44:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
  expect(
    isPriceUpdateTime(new Date("2026-11-02T01:45:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: true,
  });
  expect(
    isPriceUpdateTime(new Date("2026-11-02T09:25:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: true,
  });
  expect(
    isPriceUpdateTime(new Date("2026-11-02T09:26:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
});

test("skips price updates on a holiday during market hours", () => {
  expect(
    isPriceUpdateTime(new Date("2026-12-25T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: false,
  });
});

test("fails for a date that no calendar covers and names the date", () => {
  expect(
    isPriceUpdateTime(new Date("2028-01-03T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2028-01-03, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
  expect(
    isPriceUpdateTime(new Date("2025-12-31T03:00:00Z"), delayMinutes),
  ).toEqual({
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

test("ends the price hours later for a source with a longer delay", () => {
  // 16:30 WIB, after the price hours of the shorter delay and within those of the longer one.
  const halfPastFour = new Date("2026-11-02T09:30:00Z");
  expect(isPriceUpdateTime(halfPastFour, 10)).toEqual({
    ok: true,
    value: false,
  });
  expect(isPriceUpdateTime(halfPastFour, 15)).toEqual({
    ok: true,
    value: true,
  });
});

test("finds today as the latest closed trading day from the minute after the price hours", () => {
  // 16:25 WIB is the last minute of the price hours of a source with this delay, and 16:26 WIB is the minute after it.
  expect(
    latestClosedTradingDay(new Date("2026-11-02T09:25:59Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: {
      date: "2026-10-30",
      closedAt: new Date("2026-10-30T09:26:00Z"),
    },
  });
  expect(
    latestClosedTradingDay(new Date("2026-11-02T09:26:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: {
      date: "2026-11-02",
      closedAt: new Date("2026-11-02T09:26:00Z"),
    },
  });
});

test("finds the trading day before the holidays and the weekend after them", () => {
  // 24 and 25 December 2026 are holidays, and the weekend follows them.
  expect(
    latestClosedTradingDay(new Date("2026-12-27T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: true,
    value: {
      date: "2026-12-23",
      closedAt: new Date("2026-12-23T09:26:00Z"),
    },
  });
});

test("fails when the search for a closed trading day reaches a date that no calendar covers", () => {
  // 1 January 2026 is a holiday, and 2 January 2026 has not closed at 10:00 WIB, so the search goes back into 2025.
  expect(
    latestClosedTradingDay(new Date("2026-01-02T03:00:00Z"), delayMinutes),
  ).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2025-12-31, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
});
