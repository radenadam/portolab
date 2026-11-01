import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { addDays, dayOfWeek } from "~/calendar-dates";
import { periodCovering } from "~/period-covering";
import type { DatePeriod } from "~/period-covering";
import { wibDateOf, wibMinuteOfDay, wibMoment } from "~/wib";

/** The trading days and hours of IDX for the dates from `from` to `until`, in WIB. */
interface TradingCalendar extends DatePeriod {
  until: string;
  /** The announcement of IDX that set the holidays, and the report it was read from. */
  source: string;
  /** Weekdays on which IDX is closed. */
  holidays: ReadonlySet<string>;
  hours: TradingHours;
}

/** The hours of the regular market of IDX on a trading day. */
interface TradingHours {
  /** The minute of the day when the pre-opening session starts. */
  sessionStartMinute: number;
  /** The minute of the day when the post-closing session ends. */
  sessionEndMinute: number;
  /** Session I and session II, in which orders match continuously, on Monday to Thursday and on Friday. */
  mondayToThursday: readonly MinuteSpan[];
  friday: readonly MinuteSpan[];
  /** The announcement of IDX that set the hours, and the reports they were read from. */
  source: string;
}

/** A span of minutes of a day in WIB, which includes its start minute and ends before its end minute. */
interface MinuteSpan {
  startMinute: number;
  endMinute: number;
}

// IDX ends session II at 15:49:59, so each session here ends before its end minute, which leaves out only the first second of 12:00 and of 11:30, when IDX ends session I. IDX shortens the sessions during Ramadan, which issue #31 tracks.
const regularMarketHours: TradingHours = {
  sessionStartMinute: 8 * 60 + 45,
  sessionEndMinute: 16 * 60 + 15,
  mondayToThursday: [
    { startMinute: 9 * 60, endMinute: 12 * 60 },
    { startMinute: 13 * 60 + 30, endMinute: 15 * 60 + 50 },
  ],
  friday: [
    { startMinute: 9 * 60, endMinute: 11 * 60 + 30 },
    { startMinute: 14 * 60, endMinute: 15 * 60 + 50 },
  ],
  source:
    "BEI letter S-02349/BEI.POP/03-2023 of 15 March 2023, which restored these hours from 3 April 2023, as Elit Sukses Sekuritas told its clients, CNBC Indonesia and Infobank News reported session I and session II on that day, and Pluang listed the pre-opening and the post-closing session in 2026",
};

// IDX rules are data with the dates they apply, as decision 0002 asks.
const tradingCalendars: readonly TradingCalendar[] = [
  {
    from: "2026-01-01",
    until: "2026-12-31",
    source:
      "the holiday calendar Peng-00171/BEI.POP/09-2025, as Metro TV and CNBC Indonesia reported it",
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
    hours: regularMarketHours,
  },
  {
    from: "2027-01-01",
    until: "2027-12-31",
    source:
      "the holiday calendar Peng-00169/BEI.POP/09-2026, as Metro TV and CNBC Indonesia reported it",
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
    hours: regularMarketHours,
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
      minuteOfDay >= calendar.value.hours.sessionStartMinute &&
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
    if (
      isTradingDayIn(calendar.value, date) &&
      finalAt(calendar.value, date, delayMinutes) <= moment
    ) {
      return succeed(date);
    }
    date = addDays(date, -1);
  }
}

/** The moment from which the prices of a trading day with this delay can no longer change, which makes its closes final. It fails for a date that no calendar covers. */
export function pricesFinalAt(
  date: string,
  delayMinutes: number,
): Result<Date, string> {
  const calendar = calendarFor(date);
  if (!calendar.ok) {
    return calendar;
  }
  return succeed(finalAt(calendar.value, date, delayMinutes));
}

// The price hours include their last minute, so the closes are final from the minute after it.
function finalAt(
  calendar: TradingCalendar,
  date: string,
  delayMinutes: number,
): Date {
  return wibMoment(date, lastPriceMinute(calendar, delayMinutes) + 1);
}

/** The trading day before a date, such as 2026-10-30 for Monday 2026-11-02. It fails when the search reaches a date that no calendar covers. */
export function tradingDayBefore(date: string): Result<string, string> {
  let candidate = addDays(date, -1);
  // Each calendar covers whole years, so going back day by day reaches either a trading day or a date that no calendar covers.
  for (;;) {
    const calendar = calendarFor(candidate);
    if (!calendar.ok) {
      return calendar;
    }
    if (isTradingDayIn(calendar.value, candidate)) {
      return succeed(candidate);
    }
    candidate = addDays(candidate, -1);
  }
}

/** Whether a moment falls in a session of continuous trading of a trading day, which is session I or session II. It fails for a date that no calendar covers. */
export function isContinuousTradingTime(moment: Date): Result<boolean, string> {
  const date = wibDateOf(moment);
  const calendar = calendarFor(date);
  if (!calendar.ok) {
    return calendar;
  }
  if (!isTradingDayIn(calendar.value, date)) {
    return succeed(false);
  }
  const minuteOfDay = wibMinuteOfDay(moment);
  return succeed(
    continuousSessionsOn(calendar.value, date).some(
      (session) =>
        minuteOfDay >= session.startMinute && minuteOfDay < session.endMinute,
    ),
  );
}

/** The start of the session of continuous trading that is open at a moment, or else of the next one to open, which is when an order placed at that moment starts to trade. It fails when the search reaches a date that no calendar covers. */
export function currentOrNextSessionStart(moment: Date): Result<Date, string> {
  let date = wibDateOf(moment);
  // Each calendar covers whole years, so going forward day by day reaches either a session that has not ended or a date that no calendar covers.
  for (;;) {
    const calendar = calendarFor(date);
    if (!calendar.ok) {
      return calendar;
    }
    const start = startOfFirstSessionEndingAfter(calendar.value, date, moment);
    if (start !== undefined) {
      return succeed(start);
    }
    date = addDays(date, 1);
  }
}

/** The start of the first session of continuous trading of a date that ends after a moment, or undefined when the date has no such session. */
function startOfFirstSessionEndingAfter(
  calendar: TradingCalendar,
  date: string,
  moment: Date,
): Date | undefined {
  if (!isTradingDayIn(calendar, date)) {
    return undefined;
  }
  const session = continuousSessionsOn(calendar, date).find(
    (candidate) => moment < wibMoment(date, candidate.endMinute),
  );
  return session === undefined
    ? undefined
    : wibMoment(date, session.startMinute);
}

function continuousSessionsOn(
  calendar: TradingCalendar,
  date: string,
): readonly MinuteSpan[] {
  const friday = 5;
  return dayOfWeek(date) === friday
    ? calendar.hours.friday
    : calendar.hours.mondayToThursday;
}

function lastPriceMinute(
  calendar: TradingCalendar,
  delayMinutes: number,
): number {
  return calendar.hours.sessionEndMinute + delayMinutes;
}

function isTradingDayIn(calendar: TradingCalendar, date: string): boolean {
  const weekday = dayOfWeek(date);
  const isWeekend = weekday === 0 || weekday === 6;
  return !isWeekend && !calendar.holidays.has(date);
}

function calendarFor(date: string): Result<TradingCalendar, string> {
  const calendar = periodCovering(tradingCalendars, date);
  if (calendar !== undefined) {
    return succeed(calendar);
  }
  return fail(
    `No IDX trading calendar covers ${date}, so add the holidays and trading hours of that year to idx-calendar.ts.`,
  );
}

/** Whether two moments fall on the same calendar day in WIB. */
export function isSameWibDay(first: Date, second: Date): boolean {
  return wibDateOf(first) === wibDateOf(second);
}
