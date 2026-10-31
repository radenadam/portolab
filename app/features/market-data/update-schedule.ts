import { isPriceUpdateTime } from "./idx-calendar";
import type { UpdateAttempt } from "./quote-store.server";

// Decision 0001 asks the job to back off when Yahoo fails, and half an hour still updates the prices several times in a session.
const longestDelayMinutes = 30;

const minuteMilliseconds = 60_000;

/** Whether the job tries to update prices with this delay in the minute of this moment. It tries whenever such prices can change, and also on a date that no IDX calendar covers, because a missing calendar must not stop the prices. */
export function isUpdateMinute(moment: Date, delayMinutes: number): boolean {
  const updateTime = isPriceUpdateTime(moment, delayMinutes);
  return !updateTime.ok || updateTime.value;
}

/** The earliest moment for the next attempt after the latest one, which is at once after a success. The wait after failures counts whole minutes from the start of the minute of the attempt, because the schedule runs at the start of each minute and its runs land a few milliseconds late. */
export function nextAttemptTime(latestAttempt: UpdateAttempt): Date {
  if (latestAttempt.consecutiveFailures === 0) {
    return latestAttempt.attemptedAt;
  }
  return new Date(
    startOfMinute(latestAttempt.attemptedAt) +
      retryDelayMinutes(latestAttempt.consecutiveFailures) * minuteMilliseconds,
  );
}

/** The minute in which the running job tries again after the latest attempt, for prices with this delay: the first minute of its schedule after the minute of that attempt, once the wait after failures has passed. */
export function nextScheduledAttempt(
  latestAttempt: UpdateAttempt,
  delayMinutes: number,
): Date {
  let minute = Math.max(
    startOfMinute(latestAttempt.attemptedAt) + minuteMilliseconds,
    nextAttemptTime(latestAttempt).getTime(),
  );
  // Each minute is tested with the rule that the job follows, so the time that the prices page promises cannot drift from what the job does.
  while (!isUpdateMinute(new Date(minute), delayMinutes)) {
    minute += minuteMilliseconds;
  }
  return new Date(minute);
}

// The minutes to wait after this many failures in a row: 1, 2, 4, 8, 16, and then 30.
function retryDelayMinutes(consecutiveFailures: number): number {
  return Math.min(2 ** (consecutiveFailures - 1), longestDelayMinutes);
}

function startOfMinute(moment: Date): number {
  return Math.floor(moment.getTime() / minuteMilliseconds) * minuteMilliseconds;
}
