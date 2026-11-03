import { expect, test } from "vitest";
import { fail, succeed } from "./result";
import { periodOf } from "./period-of";

const year2026 = { from: "2026-01-01", until: "2026-12-31" };
const from2027 = { from: "2027-01-01" };
const calendars = {
  name: "the calendars",
  file: "calendars.ts",
  periods: [year2026, from2027],
};

test("finds the period that covers a date, with both ends included", () => {
  expect(periodOf(calendars, "2026-01-01")).toEqual(succeed(year2026));
  expect(periodOf(calendars, "2026-12-31")).toEqual(succeed(year2026));
});

test("finds a period without an end on every date from its start", () => {
  expect(periodOf(calendars, "2027-01-01")).toEqual(succeed(from2027));
  expect(periodOf(calendars, "2099-06-30")).toEqual(succeed(from2027));
});

test("fails with the name of the table for a date before every period", () => {
  expect(periodOf(calendars, "2025-12-31")).toEqual(fail("the calendars"));
});

test("throws when two periods cover one date, because the data leaves an earlier period open, and names the table, its file, and both periods", () => {
  const overlapping = {
    ...calendars,
    periods: [
      { from: "2027-01-01", until: "2027-12-31" },
      { from: "2026-01-01" },
    ],
  };
  expect(() => periodOf(overlapping, "2027-06-30")).toThrow(
    "Only one period of the calendars in calendars.ts may cover a date, but 2 periods cover 2027-06-30: the one from 2026-01-01 with no end and the one from 2027-01-01 to 2027-12-31. End each period before the next one starts.",
  );
});

test("throws when two periods with ends cover one date, and names the end of each", () => {
  const overlapping = {
    ...calendars,
    periods: [
      { from: "2026-01-01", until: "2026-12-31" },
      { from: "2026-06-01", until: "2027-05-31" },
    ],
  };
  expect(() => periodOf(overlapping, "2026-07-01")).toThrow(
    "Only one period of the calendars in calendars.ts may cover a date, but 2 periods cover 2026-07-01: the one from 2026-01-01 to 2026-12-31 and the one from 2026-06-01 to 2027-05-31. End each period before the next one starts.",
  );
});
