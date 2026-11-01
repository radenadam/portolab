import { expect, test } from "vitest";
import { periodCovering } from "./period-covering";

const periods = [
  { name: "2026", from: "2026-01-01", until: "2026-12-31" },
  { name: "from 2027", from: "2027-01-01" },
];

test("finds the period that covers a date, with both ends included", () => {
  expect(periodCovering(periods, "2026-01-01")?.name).toBe("2026");
  expect(periodCovering(periods, "2026-12-31")?.name).toBe("2026");
});

test("finds a period without an end on every date from its start", () => {
  expect(periodCovering(periods, "2027-01-01")?.name).toBe("from 2027");
  expect(periodCovering(periods, "2099-06-30")?.name).toBe("from 2027");
});

test("finds no period for a date before every period", () => {
  expect(periodCovering(periods, "2025-12-31")).toBeUndefined();
});

test("throws when two periods cover one date, because the data leaves an earlier period open", () => {
  const overlapping = [
    { from: "2026-01-01" },
    { from: "2027-01-01", until: "2027-12-31" },
  ];
  expect(() => periodCovering(overlapping, "2027-06-30")).toThrow(
    "Only one period may cover a date, but 2 periods cover 2027-06-30, from 2026-01-01 and from 2027-01-01. Give the earlier period an end.",
  );
});
