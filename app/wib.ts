// WIB keeps one offset from UTC all year, because Indonesia has no daylight saving time, and IDX publishes every time in WIB.
const wibOffsetHours = 7;

const wibOffsetMilliseconds = wibOffsetHours * 60 * 60 * 1000;

/** WIB as a time zone for Intl, whose names of fixed zones count the hours west of UTC, so a zone east of UTC takes a minus sign. */
export const wibTimeZone = `Etc/GMT-${String(wibOffsetHours)}`;

/** The calendar date of a moment in WIB, such as 2026-10-30. */
export function wibDateOf(moment: Date): string {
  return toWibClock(moment).toISOString().slice(0, 10);
}

/** The minutes since midnight in WIB at a moment, such as 975 at 16:15 WIB. */
export function wibMinuteOfDay(moment: Date): number {
  const clock = toWibClock(moment);
  return clock.getUTCHours() * 60 + clock.getUTCMinutes();
}

/** The moment when a date in WIB, such as 2026-10-30, begins. */
export function startOfWibDate(date: string): Date {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) - wibOffsetMilliseconds);
}

/** Shifts a moment so that its UTC fields read as the wall clock in WIB. */
function toWibClock(moment: Date): Date {
  return new Date(moment.getTime() + wibOffsetMilliseconds);
}
