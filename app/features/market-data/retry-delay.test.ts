import { expect, test } from "vitest";
import { nextAttemptTime, retryDelayMinutes } from "./retry-delay";

test("doubles the wait after each failure in a row, up to 30 minutes", () => {
  const delays: number[] = [];
  for (let failures = 1; failures <= 7; failures += 1) {
    delays.push(retryDelayMinutes(failures));
  }
  expect(delays).toEqual([1, 2, 4, 8, 16, 30, 30]);
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
