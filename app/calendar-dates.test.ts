import { expect, test } from "vitest";
import {
  addDays,
  dayOfWeek,
  startOfMonth,
  startOfUtcDate,
  utcDateOf,
} from "./calendar-dates";

test("reads a calendar date in UTC, where it begins at midnight", () => {
  expect(utcDateOf(new Date("2026-10-30T23:59:59.999Z"))).toBe("2026-10-30");
  expect(startOfUtcDate("2026-10-30")).toEqual(
    new Date("2026-10-30T00:00:00.000Z"),
  );
});

test("adds days across the end of a month and a year, and subtracts them", () => {
  expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
});

test("finds the first day of a month some months away, across years", () => {
  expect(startOfMonth("2026-11-01", -62)).toBe("2021-09-01");
  expect(startOfMonth("2026-10-31", 0)).toBe("2026-10-01");
  expect(startOfMonth("2026-12-31", 1)).toBe("2027-01-01");
});

test("counts the day of the week from 0 for Sunday", () => {
  expect(dayOfWeek("2026-11-01")).toBe(0);
  expect(dayOfWeek("2026-10-30")).toBe(5);
  expect(dayOfWeek("2026-10-31")).toBe(6);
});
