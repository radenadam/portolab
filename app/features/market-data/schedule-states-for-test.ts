import { secondMilliseconds } from "~/time-units";
import type { Locale } from "~/paraglide/runtime.js";
import type { UpdateAttempt } from "./update-attempts.server";

/** The sentence that says when the quote job tries again, around the time of the next attempt, in each language. */
export const nextAttemptSentencesForTest: Record<
  Locale,
  (time: string) => string
> = {
  id: (time: string) => `Portolab mencoba lagi pada ${time} WIB.`,
  en: (time: string) => `Portolab tries again at ${time} WIB.`,
};

/** A state of the schedule of the quote job, with the moment of an attempt in it and the time of the next attempt after an answer that lacked a price and after three failures in a row. */
interface ScheduleStateForTest {
  name: string;
  attemptedAt: string;
  afterMissingPrice: Record<Locale, string>;
  afterFailures: Record<Locale, string>;
}

/** An attempt at 10:00 WIB on Monday 2 November 2026, in session I. */
export const sessionStateForTest: ScheduleStateForTest = {
  name: "during a session",
  attemptedAt: "2026-11-02T03:00:00.000Z",
  afterMissingPrice: { id: "2 Nov 2026, 10.01", en: "Nov 2, 2026, 10:01 AM" },
  afterFailures: { id: "2 Nov 2026, 10.04", en: "Nov 2, 2026, 10:04 AM" },
};

/** Each state of the schedule of the quote job, with the times of the next attempt worked out by hand from the calendars in idx-calendar.ts and the backoff in update-schedule.ts. */
export const scheduleStatesForTest: readonly ScheduleStateForTest[] = [
  sessionStateForTest,
  {
    name: "in the last minute of the price hours",
    attemptedAt: "2026-11-02T09:24:00.000Z",
    afterMissingPrice: { id: "2 Nov 2026, 16.25", en: "Nov 2, 2026, 4:25 PM" },
    afterFailures: { id: "3 Nov 2026, 08.45", en: "Nov 3, 2026, 8:45 AM" },
  },
  {
    name: "after the close",
    attemptedAt: "2026-11-02T09:30:00.000Z",
    afterMissingPrice: { id: "3 Nov 2026, 08.45", en: "Nov 3, 2026, 8:45 AM" },
    afterFailures: { id: "3 Nov 2026, 08.45", en: "Nov 3, 2026, 8:45 AM" },
  },
  {
    name: "on a weekend",
    attemptedAt: "2026-10-31T03:00:00.000Z",
    afterMissingPrice: { id: "2 Nov 2026, 08.45", en: "Nov 2, 2026, 8:45 AM" },
    afterFailures: { id: "2 Nov 2026, 08.45", en: "Nov 2, 2026, 8:45 AM" },
  },
  {
    name: "on a holiday before a weekend",
    attemptedAt: "2026-12-24T03:00:00.000Z",
    afterMissingPrice: {
      id: "28 Des 2026, 08.45",
      en: "Dec 28, 2026, 8:45 AM",
    },
    afterFailures: { id: "28 Des 2026, 08.45", en: "Dec 28, 2026, 8:45 AM" },
  },
  {
    name: "on a date that no calendar covers",
    attemptedAt: "2028-01-03T03:00:00.000Z",
    afterMissingPrice: { id: "3 Jan 2028, 10.01", en: "Jan 3, 2028, 10:01 AM" },
    afterFailures: { id: "3 Jan 2028, 10.04", en: "Jan 3, 2028, 10:04 AM" },
  },
];

/** An attempt of the quote job in a state of the schedule, which answered with some prices or failed for the third time in a row, and which could not update the prices of some codes. */
export function attemptInStateForTest(
  state: ScheduleStateForTest,
  { succeeded, failedCodes }: { succeeded: boolean; failedCodes: string[] },
): UpdateAttempt {
  return {
    attemptedAt: new Date(state.attemptedAt),
    succeeded,
    consecutiveFailures: succeeded ? 0 : 3,
    failedCodes,
  };
}

/** The moment half a minute after the attempt of a state of the schedule, when a reader sees it. */
export function halfMinuteAfterForTest(state: ScheduleStateForTest): Date {
  return new Date(Date.parse(state.attemptedAt) + 30 * secondMilliseconds);
}

/** The time of the next attempt after an attempt in a state of the schedule, which waits longer after failures in a row. */
export function nextAttemptTimeForTest(
  state: ScheduleStateForTest,
  succeeded: boolean,
  locale: Locale,
): string {
  return succeeded
    ? state.afterMissingPrice[locale]
    : state.afterFailures[locale];
}
