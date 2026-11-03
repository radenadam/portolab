import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { listOfWords } from "~/sentences";

/** A span of calendar dates in WIB in which some data applies, such as the year of a trading calendar or the rules of IDX. */
export interface DatePeriod {
  /** The first date of the period, such as 2026-01-01. */
  from: string;
  /** The last date of the period, or none while the data still applies. */
  until?: string;
}

/** The period that covers a date, with both ends included, or undefined when none covers it. The source names the table of periods, such as "the trading calendars in idx-calendar.ts", for the failure when two periods cover the date. */
export function periodCovering<Period extends DatePeriod>(
  periods: readonly Period[],
  date: string,
  source: string,
): Period | undefined {
  const covering = periods.filter((period) => covers(period, date));
  // Two periods over one date would hide one of them, so they are a defect in the data.
  if (covering.length > 1) {
    const byStart = covering.toSorted((first, second) =>
      first.from.localeCompare(second.from),
    );
    throw new Error(
      `Only one period of ${source} may cover a date, but ${String(covering.length)} periods cover ${date}: ${listOfWords(byStart.map(describePeriod))}. End each period before the next one starts.`,
    );
  }
  return covering[0];
}

/** A table of dated periods, with the name that a failure gives it, such as "the tick sizes", and the file that holds it. */
export interface PeriodTable<Period extends DatePeriod> {
  name: string;
  file: string;
  periods: readonly Period[];
}

/** The period of a table that covers a date, or else the name of the table, which its caller names together with the other tables that lack a period for the date. */
export function periodOf<Period extends DatePeriod>(
  table: PeriodTable<Period>,
  date: string,
): Result<Period, string> {
  const period = periodCovering(
    table.periods,
    date,
    `${table.name} in ${table.file}`,
  );
  return period === undefined ? fail(table.name) : succeed(period);
}

function describePeriod(period: DatePeriod): string {
  return period.until === undefined
    ? `the one from ${period.from} with no end`
    : `the one from ${period.from} to ${period.until}`;
}

function covers(period: DatePeriod, date: string): boolean {
  const hasEnded = period.until !== undefined && date > period.until;
  return date >= period.from && !hasEnded;
}
