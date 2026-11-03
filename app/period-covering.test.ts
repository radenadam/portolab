import { expect, test } from "vitest";
import { periodCovering, periodOf } from "./period-covering";

const source = "the calendars in calendars.ts";

const periods = [
  { name: "2026", from: "2026-01-01", until: "2026-12-31" },
  { name: "from 2027", from: "2027-01-01" },
];

test("finds the period that covers a date, with both ends included", () => {
  expect(periodCovering(periods, "2026-01-01", source)?.name).toBe("2026");
  expect(periodCovering(periods, "2026-12-31", source)?.name).toBe("2026");
});

test("finds a period without an end on every date from its start", () => {
  expect(periodCovering(periods, "2027-01-01", source)?.name).toBe("from 2027");
  expect(periodCovering(periods, "2099-06-30", source)?.name).toBe("from 2027");
});

test("finds no period for a date before every period", () => {
  expect(periodCovering(periods, "2025-12-31", source)).toBeUndefined();
});

test("throws when two periods cover one date, because the data leaves an earlier period open, and names the table and both periods", () => {
  const overlapping = [
    { from: "2027-01-01", until: "2027-12-31" },
    { from: "2026-01-01" },
  ];
  expect(() => periodCovering(overlapping, "2027-06-30", source)).toThrow(
    "Only one period of the calendars in calendars.ts may cover a date, but 2 periods cover 2027-06-30: the one from 2026-01-01 with no end and the one from 2027-01-01 to 2027-12-31. End each period before the next one starts.",
  );
});

test("throws when two periods with ends cover one date, and names the end of each", () => {
  const overlapping = [
    { from: "2026-01-01", until: "2026-12-31" },
    { from: "2026-06-01", until: "2027-05-31" },
  ];
  expect(() => periodCovering(overlapping, "2026-07-01", source)).toThrow(
    "Only one period of the calendars in calendars.ts may cover a date, but 2 periods cover 2026-07-01: the one from 2026-01-01 to 2026-12-31 and the one from 2026-06-01 to 2027-05-31. End each period before the next one starts.",
  );
});

test("gives the period of a table that covers a date, or else the name of the table", () => {
  const table = { name: "the calendars", file: "calendars.ts", periods };
  expect(periodOf(table, "2026-06-30")).toEqual({
    ok: true,
    value: periods[0],
  });
  expect(periodOf(table, "2025-12-31")).toEqual({
    ok: false,
    failure: "the calendars",
  });
});
