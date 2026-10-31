// Weekdays on which IDX is closed. Sources: the IDX holiday calendars Peng-00171/BEI.POP/09-2025 for 2026 and Peng-00169/BEI.POP/09-2026 for 2027, as reported by Metro TV and CNBC Indonesia.
const exchangeHolidays = new Set([
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
]);

// WIB is UTC+7 all year, because Indonesia has no daylight saving time.
const wibOffsetMilliseconds = 7 * 60 * 60 * 1000;

// From the pre-opening session at 08:45 WIB to the end of post-closing at 16:15 WIB, plus the 10 minutes that delayed prices lag behind.
const priceUpdateStartMinute = 8 * 60 + 45;
const priceUpdateEndMinute = 16 * 60 + 25;

/** Whether IDX trades on the WIB calendar day of this moment. */
export function isTradingDay(moment: Date): boolean {
  const wib = toWibClock(moment);
  const dayOfWeek = wib.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return !isWeekend && !exchangeHolidays.has(wib.toISOString().slice(0, 10));
}

/** Whether delayed prices can still change at this moment, so that fetching them is worthwhile. */
export function isPriceUpdateTime(moment: Date): boolean {
  const wib = toWibClock(moment);
  const minuteOfDay = wib.getUTCHours() * 60 + wib.getUTCMinutes();
  return (
    isTradingDay(moment) &&
    minuteOfDay >= priceUpdateStartMinute &&
    minuteOfDay <= priceUpdateEndMinute
  );
}

/** Shifts a moment so that its UTC fields read as the wall clock in WIB. */
function toWibClock(moment: Date): Date {
  return new Date(moment.getTime() + wibOffsetMilliseconds);
}
