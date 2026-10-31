import type { UpdateAttempt } from "./quote-store.server";

// Decision 0001 asks the job to back off when Yahoo fails, and half an hour still updates the prices several times in a session.
const longestDelayMinutes = 30;

/** The minutes to wait before the next attempt after this many failures in a row: 1, 2, 4, 8, 16, and then 30. */
export function retryDelayMinutes(consecutiveFailures: number): number {
  return Math.min(2 ** (consecutiveFailures - 1), longestDelayMinutes);
}

/** The earliest moment for the next attempt after the latest one, which is at once after a success. */
export function nextAttemptTime(latestAttempt: UpdateAttempt): Date {
  if (latestAttempt.consecutiveFailures === 0) {
    return latestAttempt.attemptedAt;
  }
  return new Date(
    latestAttempt.attemptedAt.getTime() +
      retryDelayMinutes(latestAttempt.consecutiveFailures) * 60_000,
  );
}
