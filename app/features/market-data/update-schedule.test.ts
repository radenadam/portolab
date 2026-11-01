import { expect, test } from "vitest";
import type { UpdateAttempt } from "./quote-store.server";
import {
  isUpdateMinute,
  nextAttemptTime,
  nextScheduledAttempt,
} from "./update-schedule";

// The expected times below follow the price hours of a source with this delay.
const delayMinutes = 10;

// The expected times were worked out by hand from the IDX calendars in idx-calendar.ts and the backoff in update-schedule.ts.

function failedAttempt(
  attemptedAt: string,
  consecutiveFailures: number,
): UpdateAttempt {
  return {
    attemptedAt: new Date(attemptedAt),
    succeeded: false,
    consecutiveFailures,
    failedCodes: ["IHSG", "BBCA"],
  };
}

test("doubles the wait after each failure in a row, up to 30 minutes", () => {
  const waits: number[] = [];
  for (let failures = 1; failures <= 7; failures += 1) {
    const attempt = failedAttempt("2026-11-02T03:00:00.000Z", failures);
    waits.push(
      (nextAttemptTime(attempt).getTime() - attempt.attemptedAt.getTime()) /
        60_000,
    );
  }
  expect(waits).toEqual([1, 2, 4, 8, 16, 30, 30]);
});

test("counts the wait from the start of the minute of a failed attempt", () => {
  // A run of the schedule lands a few milliseconds after its minute, and a later run may land a little earlier after its own minute.
  expect(nextAttemptTime(failedAttempt("2026-10-30T09:00:00.005Z", 1))).toEqual(
    new Date("2026-10-30T09:01:00.000Z"),
  );
  expect(nextAttemptTime(failedAttempt("2026-10-30T09:00:30.000Z", 2))).toEqual(
    new Date("2026-10-30T09:02:00.000Z"),
  );
});

test("allows the next attempt at once after a success", () => {
  const attemptedAt = new Date("2026-10-30T09:00:00.000Z");
  expect(
    nextAttemptTime({
      attemptedAt,
      succeeded: true,
      consecutiveFailures: 0,
      failedCodes: [],
    }),
  ).toEqual(attemptedAt);
});

test("tries to update during the price hours of a trading day, and on a date that no calendar covers", () => {
  expect(
    isUpdateMinute(new Date("2026-11-02T03:00:00.000Z"), delayMinutes),
  ).toBe(true);
  expect(
    isUpdateMinute(new Date("2026-11-02T12:00:00.000Z"), delayMinutes),
  ).toBe(false);
  expect(
    isUpdateMinute(new Date("2026-10-31T03:00:00.000Z"), delayMinutes),
  ).toBe(false);
  expect(
    isUpdateMinute(new Date("2026-12-25T03:00:00.000Z"), delayMinutes),
  ).toBe(false);
  expect(
    isUpdateMinute(new Date("2028-01-01T12:00:00.000Z"), delayMinutes),
  ).toBe(true);
});

test("tries again in the next minute during a session after an attempt that missed some prices", () => {
  expect(
    nextScheduledAttempt(
      {
        attemptedAt: new Date("2026-11-02T03:00:00.005Z"),
        succeeded: true,
        consecutiveFailures: 0,
        failedCodes: ["BBRI"],
      },
      delayMinutes,
    ),
  ).toEqual(new Date("2026-11-02T03:01:00.000Z"));
});

test("tries again after the wait during a session", () => {
  expect(
    nextScheduledAttempt(
      failedAttempt("2026-11-02T03:00:30.000Z", 3),
      delayMinutes,
    ),
  ).toEqual(new Date("2026-11-02T03:04:00.000Z"));
});

test("tries again in the last minute of the price hours", () => {
  expect(
    nextScheduledAttempt(
      failedAttempt("2026-11-02T09:24:00.000Z", 1),
      delayMinutes,
    ),
  ).toEqual(new Date("2026-11-02T09:25:00.000Z"));
});

test("tries again at the start of the next trading day after the close", () => {
  expect(
    nextScheduledAttempt(
      failedAttempt("2026-11-02T09:25:00.000Z", 1),
      delayMinutes,
    ),
  ).toEqual(new Date("2026-11-03T01:45:00.000Z"));
});

test("tries again on Monday after a failure after the Friday close", () => {
  expect(
    nextScheduledAttempt(
      failedAttempt("2026-10-30T09:30:00.000Z", 1),
      delayMinutes,
    ),
  ).toEqual(new Date("2026-11-02T01:45:00.000Z"));
});

test("tries again on Monday after a failed fetch at startup on a Saturday", () => {
  expect(
    nextScheduledAttempt(
      failedAttempt("2026-10-31T13:00:00.000Z", 1),
      delayMinutes,
    ),
  ).toEqual(new Date("2026-11-02T01:45:00.000Z"));
});

test("tries again after the holidays and the weekend that follow them", () => {
  // The holidays of the 2026 calendar and the weekend after them close IDX until Monday.
  expect(
    nextScheduledAttempt(
      failedAttempt("2026-12-23T09:30:00.000Z", 1),
      delayMinutes,
    ),
  ).toEqual(new Date("2026-12-28T01:45:00.000Z"));
});

test("tries again in the first minute of a date that no calendar covers, as the job does", () => {
  // 31 December 2027 is a holiday, and no calendar covers 2028 yet.
  expect(
    nextScheduledAttempt(
      failedAttempt("2027-12-30T09:30:00.000Z", 1),
      delayMinutes,
    ),
  ).toEqual(new Date("2027-12-31T17:00:00.000Z"));
});
