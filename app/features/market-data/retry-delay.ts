import type { UpdateAttempt } from "./quote-store.server";

// Decision 0001 asks the job to back off when Yahoo fails, and half an hour still updates the prices several times in a session.
const longestDelayMinutes = 30;

/** The minutes to wait before the next attempt after this many failures in a row: 1, 2, 4, 8, 16, and then 30. */
export function retryDelayMinutes(consecutiveFailures: number): number {
  return Math.min(2 ** (consecutiveFailures - 1), longestDelayMinutes);
}

const minuteMilliseconds = 60_000;

/** The earliest moment for the next attempt after the latest one, which is at once after a success. The wait counts whole minutes from the start of the minute of the attempt, because the schedule runs at the start of each minute and its runs land a few milliseconds late. */
export function nextAttemptTime(latestAttempt: UpdateAttempt): Date {
  if (latestAttempt.consecutiveFailures === 0) {
    return latestAttempt.attemptedAt;
  }
  const attemptMinute =
    Math.floor(latestAttempt.attemptedAt.getTime() / minuteMilliseconds) *
    minuteMilliseconds;
  return new Date(
    attemptMinute +
      retryDelayMinutes(latestAttempt.consecutiveFailures) * minuteMilliseconds,
  );
}
