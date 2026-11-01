import { dayMilliseconds } from "./time-units.ts";

// A calendar date, such as 2026-10-30, names a day without a time zone, so its arithmetic runs in UTC, where every day has 24 hours.

/** The calendar date of a moment in UTC, such as 2026-10-30. */
export function utcDateOf(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

/** The moment when a calendar date begins in UTC. */
export function startOfUtcDate(date: string): Date {
  return new Date(Date.parse(`${date}T00:00:00.000Z`));
}

/** The date that is a number of days after a date, or before it for a negative number, such as 2026-10-29 for 2026-10-30 and -1. */
export function addDays(date: string, days: number): string {
  return utcDateOf(
    new Date(startOfUtcDate(date).getTime() + days * dayMilliseconds),
  );
}

/** The first day of the month that is a number of months after the month of a date, or before it for a negative number, such as 2021-09-01 for 2026-11-30 and -62, or 2026-10-01 for 2026-10-30 and 0. */
export function startOfMonth(date: string, months: number): string {
  const moment = startOfUtcDate(date);
  moment.setUTCDate(1);
  moment.setUTCMonth(moment.getUTCMonth() + months);
  return utcDateOf(moment);
}

/** The day of the week of a date, from 0 for Sunday to 6 for Saturday. */
export function dayOfWeek(date: string): number {
  return startOfUtcDate(date).getUTCDay();
}
