import { expect, test } from "vitest";
import { createAttemptLimiter } from "./create-attempt-limiter.server";
import type { AttemptLimiter } from "./create-attempt-limiter.server";

const start = new Date("2026-11-02T03:00:00.000Z");

function minutesAfterStart(minutes: number): Date {
  return new Date(start.getTime() + minutes * 60_000);
}

/** Starts an attempt of the key "budi" at each minute after the start, and returns what each attempt answered. */
function attemptsAt(
  limiter: AttemptLimiter,
  minutes: readonly number[],
): (Date | undefined)[] {
  return minutes.map((minute) =>
    limiter.startAttempt("budi", minutesAfterStart(minute)),
  );
}

test("lets a key try until its attempts reach the limit within the window", () => {
  const limiter = createAttemptLimiter({ failures: 3, windowMinutes: 15 });
  expect(attemptsAt(limiter, [0, 1, 2, 3])).toEqual([
    undefined,
    undefined,
    undefined,
    minutesAfterStart(15),
  ]);
});

test("blocks a key until the attempt that keeps it at the limit leaves the window", () => {
  const limiter = createAttemptLimiter({ failures: 2, windowMinutes: 15 });
  expect(attemptsAt(limiter, [0, 5, 10, 15, 16])).toEqual([
    undefined,
    undefined,
    minutesAfterStart(15),
    undefined,
    minutesAfterStart(20),
  ]);
});

test("does not count a blocked attempt, so the block ends on time", () => {
  const limiter = createAttemptLimiter({ failures: 1, windowMinutes: 15 });
  const minutes: number[] = [];
  const answers: (Date | undefined)[] = [];
  for (let minute = 0; minute <= 15; minute += 1) {
    minutes.push(minute);
    answers.push(
      minute === 0 || minute === 15 ? undefined : minutesAfterStart(15),
    );
  }
  expect(attemptsAt(limiter, minutes)).toEqual(answers);
});

test("counts attempts that run at the same time before any of them ends", () => {
  const limiter = createAttemptLimiter({ failures: 2, windowMinutes: 15 });
  expect(attemptsAt(limiter, [0, 0, 0])).toEqual([
    undefined,
    undefined,
    minutesAfterStart(15),
  ]);
});

test("takes back an attempt that succeeded, and only that one", () => {
  const limiter = createAttemptLimiter({ failures: 2, windowMinutes: 15 });
  attemptsAt(limiter, [0, 1]);
  limiter.takeBack("budi", minutesAfterStart(1));
  expect(attemptsAt(limiter, [2, 3])).toEqual([
    undefined,
    minutesAfterStart(15),
  ]);
});

test("counts the attempts of each key apart from the others", () => {
  const limiter = createAttemptLimiter({ failures: 1, windowMinutes: 15 });
  attemptsAt(limiter, [0]);
  expect(limiter.startAttempt("sari", start)).toBeUndefined();
  expect(attemptsAt(limiter, [0])).toEqual([minutesAfterStart(15)]);
});

test("forgets every attempt of a key on request", () => {
  const limiter = createAttemptLimiter({ failures: 1, windowMinutes: 15 });
  attemptsAt(limiter, [0]);
  limiter.forget("budi");
  expect(attemptsAt(limiter, [0])).toEqual([undefined]);
});
