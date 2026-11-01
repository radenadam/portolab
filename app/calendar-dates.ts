// A calendar date, such as 2026-10-30, names a day without a time zone, so its arithmetic runs in UTC, where every day has 24 hours.
const dayMilliseconds = 24 * 60 * 60 * 1000;

/** The date that is a number of days after a date, or before it for a negative number, such as 2026-10-29 for 2026-10-30 and -1. */
export function addDays(date: string, days: number): string {
  return new Date(dateTime(date) + days * dayMilliseconds)
    .toISOString()
    .slice(0, 10);
}

/** The first day of the month that is a number of months after the month of a date, or before it for a negative number, such as 2021-09-01 for 2026-11-30 and -62, or 2026-10-01 for 2026-10-30 and 0. */
export function startOfMonth(date: string, months: number): string {
  const moment = new Date(dateTime(date));
  moment.setUTCDate(1);
  moment.setUTCMonth(moment.getUTCMonth() + months);
  return moment.toISOString().slice(0, 10);
}

/** The Monday of the week of a date, such as 2026-10-26 for 2026-10-30, because a week of IDX trading runs from Monday to Friday. */
export function startOfWeek(date: string): string {
  // getUTCDay counts from Sunday, so Monday is 0 days into its week and Sunday is 6.
  return addDays(date, -((dayOfWeek(date) + 6) % 7));
}

/** The day of the week of a date, from 0 for Sunday to 6 for Saturday. */
export function dayOfWeek(date: string): number {
  return new Date(dateTime(date)).getUTCDay();
}

function dateTime(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}
