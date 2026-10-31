import { fail, succeed } from "~/result";
import type { Result } from "~/result";

/** The trading days and hours of IDX for the dates from `from` to `until`, in WIB. */
interface TradingCalendar {
  from: string;
  until: string;
  /** Weekdays on which IDX is closed. */
  holidays: ReadonlySet<string>;
  /** The minute of the day when delayed prices start to change, from the pre-opening session. */
  priceUpdateStartMinute: number;
  /** The minute of the day when delayed prices stop changing, after the post-closing session and the delay. */
  priceUpdateEndMinute: number;
}

// IDX rules are data with the dates they apply, as decision 0002 asks. Sources: the IDX holiday calendars Peng-00171/BEI.POP/09-2025 for 2026 and Peng-00169/BEI.POP/09-2026 for 2027, as reported by Metro TV and CNBC Indonesia. Prices change from the pre-opening session at 08:45 WIB to the end of post-closing at 16:15 WIB, plus the 10 minutes that delayed prices lag behind.
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
    priceUpdateStartMinute: 8 * 60 + 45,
    priceUpdateEndMinute: 16 * 60 + 25,
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
    priceUpdateStartMinute: 8 * 60 + 45,
    priceUpdateEndMinute: 16 * 60 + 25,
  },
];

// WIB is UTC+7 all year, because Indonesia has no daylight saving time.
const wibOffsetMilliseconds = 7 * 60 * 60 * 1000;

/** Whether delayed prices can still change at this moment, so that fetching them is worthwhile. It fails for a date that no calendar covers, so a missing year is noticed instead of every weekday counting as a trading day. */
export function isPriceUpdateTime(moment: Date): Result<boolean, string> {
  const wib = toWibClock(moment);
  const calendar = calendarFor(wib);
  if (!calendar.ok) {
    return calendar;
  }
  const minuteOfDay = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  return succeed(
    isTradingDayIn(calendar.value, wib) &&
      minuteOfDay >= calendar.value.priceUpdateStartMinute &&
      minuteOfDay <= calendar.value.priceUpdateEndMinute,
  );
}

function isTradingDayIn(calendar: TradingCalendar, wib: Date): boolean {
  const dayOfWeek = wib.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return !isWeekend && !calendar.holidays.has(wibDate(wib));
}

function calendarFor(wib: Date): Result<TradingCalendar, string> {
  const date = wibDate(wib);
  for (const calendar of tradingCalendars) {
    if (date >= calendar.from && date <= calendar.until) {
      return succeed(calendar);
    }
  }
  return fail(
    `No IDX trading calendar covers ${date}, so add the holidays and trading hours of that year to idx-calendar.ts.`,
  );
}

/** Shifts a moment so that its UTC fields read as the wall clock in WIB. */
function toWibClock(moment: Date): Date {
  return new Date(moment.getTime() + wibOffsetMilliseconds);
}

function wibDate(wib: Date): string {
  return wib.toISOString().slice(0, 10);
}

/** Whether two moments fall on the same calendar day in WIB. */
export function isSameWibDay(first: Date, second: Date): boolean {
  return wibDate(toWibClock(first)) === wibDate(toWibClock(second));
}
