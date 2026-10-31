import { expect, test } from "vitest";
import { nextAttemptTime, retryDelayMinutes } from "./retry-delay";

test("doubles the wait after each failure in a row, up to 30 minutes", () => {
  const delays: number[] = [];
  for (let failures = 1; failures <= 7; failures += 1) {
    delays.push(retryDelayMinutes(failures));
  }
  expect(delays).toEqual([1, 2, 4, 8, 16, 30, 30]);
});

test("counts the wait from the start of the minute of a failed attempt", () => {
  // A run of the schedule lands a few milliseconds after its minute, and a later run may land a little earlier after its own minute.
  expect(
    nextAttemptTime({
      attemptedAt: new Date("2026-10-30T09:00:00.005Z"),
      succeeded: false,
      consecutiveFailures: 1,
    }),
  ).toEqual(new Date("2026-10-30T09:01:00.000Z"));
  expect(
    nextAttemptTime({
      attemptedAt: new Date("2026-10-30T09:00:30.000Z"),
      succeeded: false,
      consecutiveFailures: 2,
    }),
  ).toEqual(new Date("2026-10-30T09:02:00.000Z"));
});

test("allows the next attempt at once after a success and later after failures", () => {
  const attemptedAt = new Date("2026-10-30T09:00:00.000Z");
  expect(
    nextAttemptTime({ attemptedAt, succeeded: true, consecutiveFailures: 0 }),
  ).toEqual(attemptedAt);
  expect(
    nextAttemptTime({ attemptedAt, succeeded: false, consecutiveFailures: 3 }),
  ).toEqual(new Date("2026-10-30T09:04:00.000Z"));
});
