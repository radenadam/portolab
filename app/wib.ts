import { startOfUtcDate, utcDateOf } from "./calendar-dates.ts";
import { hourMilliseconds, minuteMilliseconds } from "./time-units.ts";

// WIB keeps one offset from UTC all year, because Indonesia has no daylight saving time, and IDX publishes every time in WIB.
const wibOffsetHours = 7;

const wibOffsetMilliseconds = wibOffsetHours * hourMilliseconds;

/** WIB as a time zone for Intl, whose names of fixed zones count the hours west of UTC, so a zone east of UTC takes a minus sign. */
export const wibTimeZone = `Etc/GMT-${String(wibOffsetHours)}`;

/** The calendar date of a moment in WIB, such as 2026-10-30. */
export function wibDateOf(moment: Date): string {
  return utcDateOf(toWibClock(moment));
}

/** The minutes since midnight in WIB at a moment, such as 975 at 16:15 WIB. */
export function wibMinuteOfDay(moment: Date): number {
  const clock = toWibClock(moment);
  return clock.getUTCHours() * 60 + clock.getUTCMinutes();
}

/** The moment of a minute of a date in WIB, such as 09:15 UTC for 975 on 2026-10-30, which is 16:15 WIB. The minute 0 is the moment when the date begins in WIB. */
export function wibMoment(date: string, minuteOfDay: number): Date {
  return new Date(
    startOfUtcDate(date).getTime() -
      wibOffsetMilliseconds +
      minuteOfDay * minuteMilliseconds,
  );
}

/** Shifts a moment so that its UTC fields read as the wall clock in WIB. */
function toWibClock(moment: Date): Date {
  return new Date(moment.getTime() + wibOffsetMilliseconds);
}
