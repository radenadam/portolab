import { expect, test } from "vitest";
import {
  currentOrNextSessionStart,
  isContinuousTradingTime,
  isPriceUpdateTime,
  isSameWibDay,
  latestClosedTradingDay,
  pricesFinalAt,
  tradingDayBefore,
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
  ).toEqual({ ok: true, value: "2026-10-30" });
  expect(
    latestClosedTradingDay(new Date("2026-11-02T09:26:00Z"), delayMinutes),
  ).toEqual({ ok: true, value: "2026-11-02" });
});

test("finds the trading day before the holidays and the weekend after them", () => {
  // 24 and 25 December 2026 are holidays, and the weekend follows them.
  expect(
    latestClosedTradingDay(new Date("2026-12-27T03:00:00Z"), delayMinutes),
  ).toEqual({ ok: true, value: "2026-12-23" });
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

// Each case gives a moment and says whether orders match continuously at it. The comment of each moment gives the time in WIB.
const continuousTradingMoments: {
  name: string;
  moment: string;
  isContinuous: boolean;
}[] = [
  // 08:59 WIB on Monday 2 November 2026, in the pre-opening session.
  {
    name: "before session I",
    moment: "2026-11-02T01:59:00Z",
    isContinuous: false,
  },
  // 09:00 WIB.
  {
    name: "from the start of session I",
    moment: "2026-11-02T02:00:00Z",
    isContinuous: true,
  },
  // 11:59 WIB.
  {
    name: "until the last minute of session I",
    moment: "2026-11-02T04:59:00Z",
    isContinuous: true,
  },
  // 12:00 WIB.
  {
    name: "in the break from Monday to Thursday",
    moment: "2026-11-02T05:00:00Z",
    isContinuous: false,
  },
  // 13:30 WIB.
  {
    name: "from the start of session II from Monday to Thursday",
    moment: "2026-11-02T06:30:00Z",
    isContinuous: true,
  },
  // 15:49 WIB.
  {
    name: "until the last minute of session II",
    moment: "2026-11-02T08:49:00Z",
    isContinuous: true,
  },
  // 15:50 WIB, in the pre-closing session.
  {
    name: "after session II",
    moment: "2026-11-02T08:50:00Z",
    isContinuous: false,
  },
  // 11:30 WIB on Friday 6 November 2026.
  {
    name: "in the longer break of a Friday",
    moment: "2026-11-06T04:30:00Z",
    isContinuous: false,
  },
  // 14:00 WIB on Friday 6 November 2026.
  {
    name: "from the start of session II on a Friday",
    moment: "2026-11-06T07:00:00Z",
    isContinuous: true,
  },
  // 10:00 WIB on Saturday 7 November 2026.
  { name: "on a weekend", moment: "2026-11-07T03:00:00Z", isContinuous: false },
  // 10:00 WIB on Thursday 24 December 2026.
  { name: "on a holiday", moment: "2026-12-24T03:00:00Z", isContinuous: false },
];

for (const { name, moment, isContinuous } of continuousTradingMoments) {
  test(`${isContinuous ? "finds" : "finds no"} continuous trading ${name}`, () => {
    expect(isContinuousTradingTime(new Date(moment))).toEqual({
      ok: true,
      value: isContinuous,
    });
  });
}

test("fails to find continuous trading on a date that no calendar covers", () => {
  expect(isContinuousTradingTime(new Date("2028-01-03T03:00:00Z"))).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2028-01-03, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
});

// Each case gives a moment and the start of the session that is open at it or opens next. The comment of each case gives both times in WIB.
const sessionStarts: { name: string; moment: string; start: string }[] = [
  // 10:00 WIB on Monday 2 November 2026 gives 09:00 WIB of that day.
  {
    name: "the open session",
    moment: "2026-11-02T03:00:00Z",
    start: "2026-11-02T02:00:00.000Z",
  },
  // 11:59 WIB, the last minute of session I, gives 09:00 WIB.
  {
    name: "session I in its last minute",
    moment: "2026-11-02T04:59:00Z",
    start: "2026-11-02T02:00:00.000Z",
  },
  // 14:00 WIB gives 13:30 WIB.
  {
    name: "the open session II",
    moment: "2026-11-02T07:00:00Z",
    start: "2026-11-02T06:30:00.000Z",
  },
  // 15:49 WIB, the last minute of session II, gives 13:30 WIB.
  {
    name: "session II in its last minute",
    moment: "2026-11-02T08:49:00Z",
    start: "2026-11-02T06:30:00.000Z",
  },
  // 08:50 WIB gives 09:00 WIB.
  {
    name: "session I before the market opens",
    moment: "2026-11-02T01:50:00Z",
    start: "2026-11-02T02:00:00.000Z",
  },
  // 12:30 WIB gives 13:30 WIB.
  {
    name: "session II in the break",
    moment: "2026-11-02T05:30:00Z",
    start: "2026-11-02T06:30:00.000Z",
  },
  // 12:00 WIB on Friday 6 November 2026 gives 14:00 WIB.
  {
    name: "the later session II in the break of a Friday",
    moment: "2026-11-06T05:00:00Z",
    start: "2026-11-06T07:00:00.000Z",
  },
  // 15:55 WIB on Monday 2 November 2026 gives 09:00 WIB on Tuesday 3 November.
  {
    name: "session I of the next day after session II",
    moment: "2026-11-02T08:55:00Z",
    start: "2026-11-03T02:00:00.000Z",
  },
  // 16:00 WIB on Friday 6 November 2026 gives 09:00 WIB on Monday 9 November.
  {
    name: "the next trading day after a weekend",
    moment: "2026-11-06T09:00:00Z",
    start: "2026-11-09T02:00:00.000Z",
  },
  // 10:00 WIB on Saturday 7 November 2026 gives 09:00 WIB on Monday 9 November.
  {
    name: "the next trading day on a weekend",
    moment: "2026-11-07T03:00:00Z",
    start: "2026-11-09T02:00:00.000Z",
  },
  // 10:00 WIB on Thursday 24 December 2026, a holiday, gives 09:00 WIB on Monday 28 December.
  {
    name: "the next trading day on a holiday",
    moment: "2026-12-24T03:00:00Z",
    start: "2026-12-28T02:00:00.000Z",
  },
  // 16:00 WIB on Wednesday 30 December 2026 gives 09:00 WIB on Monday 4 January 2027, after two holidays and a weekend.
  {
    name: "the next trading day in the calendar of the next year",
    moment: "2026-12-30T09:00:00Z",
    start: "2027-01-04T02:00:00.000Z",
  },
];

for (const { name, moment, start } of sessionStarts) {
  test(`finds the start of ${name}`, () => {
    expect(currentOrNextSessionStart(new Date(moment))).toEqual({
      ok: true,
      value: new Date(start),
    });
  });
}

test("fails when the search for the next session reaches a date that no calendar covers", () => {
  // 16:00 WIB on Thursday 30 December 2027, and 31 December 2027 is a holiday.
  expect(currentOrNextSessionStart(new Date("2027-12-30T09:00:00Z"))).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2028-01-01, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
});

test("makes the prices of a trading day final from the minute after the price hours of the delay", () => {
  // 16:26 WIB for a delay of 10 minutes, and 16:31 WIB for a delay of 15 minutes.
  expect(pricesFinalAt("2026-11-02", 10)).toEqual({
    ok: true,
    value: new Date("2026-11-02T09:26:00.000Z"),
  });
  expect(pricesFinalAt("2026-11-02", 15)).toEqual({
    ok: true,
    value: new Date("2026-11-02T09:31:00.000Z"),
  });
});

test("fails to find when the prices of a date that no calendar covers are final", () => {
  expect(pricesFinalAt("2028-01-03", 10)).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2028-01-03, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
});

// Each case gives a date and the trading day before it.
const previousTradingDays: { name: string; date: string; before: string }[] = [
  { name: "a weekday", date: "2026-11-03", before: "2026-11-02" },
  { name: "a weekend", date: "2026-11-09", before: "2026-11-06" },
  // 24 and 25 December 2026 are holidays.
  { name: "holidays and a weekend", date: "2026-12-28", before: "2026-12-23" },
  // 31 December 2026 and 1 January 2027 are holidays.
  { name: "the turn of the year", date: "2027-01-04", before: "2026-12-30" },
];

for (const { name, date, before } of previousTradingDays) {
  test(`finds the trading day before ${name}`, () => {
    expect(tradingDayBefore(date)).toEqual({ ok: true, value: before });
  });
}

test("fails when the search for the trading day before a date reaches a date that no calendar covers", () => {
  // 1 January 2026 is a holiday, so the search goes back into 2025.
  expect(tradingDayBefore("2026-01-02")).toEqual({
    ok: false,
    failure:
      "No IDX trading calendar covers 2025-12-31, so add the holidays and trading hours of that year to idx-calendar.ts.",
  });
});
