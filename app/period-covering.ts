/** A span of calendar dates in WIB in which some data applies, such as the year of a trading calendar or the rules of IDX. */
export interface DatePeriod {
  /** The first date of the period, such as 2026-01-01. */
  from: string;
  /** The last date of the period, or none while the data still applies. */
  until?: string;
}

/** The period that covers a date, with both ends included, or undefined when none covers it. */
export function periodCovering<Period extends DatePeriod>(
  periods: readonly Period[],
  date: string,
): Period | undefined {
  const covering = periods.filter((period) => covers(period, date));
  // A new period that leaves the previous one open would hide one of the two, so two periods over one date are a defect in the data.
  if (covering.length > 1) {
    throw new Error(
      `Only one period may cover a date, but ${String(covering.length)} periods cover ${date}, from ${covering.map((period) => period.from).join(" and from ")}. Give the earlier period an end.`,
    );
  }
  return covering[0];
}

function covers(period: DatePeriod, date: string): boolean {
  const hasEnded = period.until !== undefined && date > period.until;
  return date >= period.from && !hasEnded;
}
