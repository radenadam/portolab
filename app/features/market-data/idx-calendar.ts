import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { addDays, dayOfWeek } from "~/calendar-dates";
import { wibDateOf, wibMinuteOfDay, wibMoment } from "~/wib";

/** The trading days and hours of IDX for the dates from `from` to `until`, in WIB. */
interface TradingCalendar {
  from: string;
  until: string;
  /** Weekdays on which IDX is closed. */
  holidays: ReadonlySet<string>;
  /** The minute of the day when the pre-opening session starts. */
  sessionStartMinute: number;
  /** The minute of the day when the post-closing session ends. */
  sessionEndMinute: number;
}

// IDX rules are data with the dates they apply, as decision 0002 asks. Sources: the IDX holiday calendars Peng-00171/BEI.POP/09-2025 for 2026 and Peng-00169/BEI.POP/09-2026 for 2027, as reported by Metro TV and CNBC Indonesia.
const tradingCalendars: readonly TradingCalendar[] = [
  {
    from: "2026-01-01",
    until: "2026-12-31",
    holidays: new Set([
      "2026-01-01",
      "2026-01-16",
      "2026-02-16",
      "2026-02-17",
      "2026-03-18",
      "2026-03-19",
      "2026-03-20",
      "2026-03-23",
      "2026-03-24",
      "2026-04-03",
      "2026-05-01",
      "2026-05-14",
      "2026-05-15",
      "2026-05-27",
      "2026-05-28",
      "2026-06-01",
      "2026-06-16",
      "2026-08-17",
      "2026-08-25",
      "2026-12-24",
      "2026-12-25",
      "2026-12-31",
    ]),
    sessionStartMinute: 8 * 60 + 45,
    sessionEndMinute: 16 * 60 + 15,
  },
  {
    from: "2027-01-01",
    until: "2027-12-31",
    holidays: new Set([
      "2027-01-01",
      "2027-01-05",
      "2027-02-16",
      "2027-03-08",
      "2027-03-09",
      "2027-03-10",
      "2027-03-11",
      "2027-03-12",
      "2027-03-15",
      "2027-03-25",
      "2027-03-26",
      "2027-05-06",
      "2027-05-17",
      "2027-05-18",
      "2027-05-19",
      "2027-05-20",
      "2027-06-01",
      "2027-08-17",
      "2027-12-24",
      "2027-12-31",
    ]),
    sessionStartMinute: 8 * 60 + 45,
    sessionEndMinute: 16 * 60 + 15,
  },
];

/** Whether prices that lag behind the exchange by this many minutes can still change at this moment, so that fetching them is worthwhile. It fails for a date that no calendar covers, so a missing year is noticed instead of every weekday counting as a trading day. */
export function isPriceUpdateTime(
  moment: Date,
  delayMinutes: number,
): Result<boolean, string> {
  const date = wibDateOf(moment);
  const calendar = calendarFor(date);
  if (!calendar.ok) {
    return calendar;
  }
  const minuteOfDay = wibMinuteOfDay(moment);
  // Fetching from the start of the pre-opening session costs nothing, and it goes on until the delayed prices show the end of the post-closing session.
  return succeed(
    isTradingDayIn(calendar.value, date) &&
      minuteOfDay >= calendar.value.sessionStartMinute &&
      minuteOfDay <= lastPriceMinute(calendar.value, delayMinutes),
  );
}

/** The latest trading day whose prices with this delay can no longer change at this moment, which makes its closes final. It fails when the search reaches a date that no calendar covers. */
export function latestClosedTradingDay(
  moment: Date,
  delayMinutes: number,
): Result<string, string> {
  let date = wibDateOf(moment);
  // Each calendar covers whole years, so going back day by day reaches either a trading day that has closed or a date that no calendar covers.
  for (;;) {
    const calendar = calendarFor(date);
    if (!calendar.ok) {
      return calendar;
    }
    if (isTradingDayIn(calendar.value, date)) {
      // The price hours include their last minute, so the closes are final from the minute after it.
      const closedAt = wibMoment(
        date,
        lastPriceMinute(calendar.value, delayMinutes) + 1,
      );
      if (closedAt <= moment) {
        return succeed(date);
      }
    }
    date = addDays(date, -1);
  }
}

function lastPriceMinute(
  calendar: TradingCalendar,
  delayMinutes: number,
): number {
  return calendar.sessionEndMinute + delayMinutes;
}

function isTradingDayIn(calendar: TradingCalendar, date: string): boolean {
  const weekday = dayOfWeek(date);
  const isWeekend = weekday === 0 || weekday === 6;
  return !isWeekend && !calendar.holidays.has(date);
}

function calendarFor(date: string): Result<TradingCalendar, string> {
  for (const calendar of tradingCalendars) {
    if (date >= calendar.from && date <= calendar.until) {
      return succeed(calendar);
    }
  }
  return fail(
    `No IDX trading calendar covers ${date}, so add the holidays and trading hours of that year to idx-calendar.ts.`,
  );
}

/** Whether two moments fall on the same calendar day in WIB. */
export function isSameWibDay(first: Date, second: Date): boolean {
  return wibDateOf(first) === wibDateOf(second);
}
