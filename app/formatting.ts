import { startOfUtcDate } from "~/calendar-dates";
import { getLocale } from "~/paraglide/runtime.js";
import { listOfWords } from "~/sentences";
import type { Beta } from "~/units/beta";
import type { Bytes } from "~/units/bytes";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { Correlation } from "~/units/correlation";
import type { IndexPoints } from "~/units/index-points";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { Rupiah } from "~/units/rupiah";
import type { SharpeRatio } from "~/units/sharpe-ratio";
import { wibTimeZone } from "~/wib";

const intlLocales = { id: "id-ID", en: "en-US" } as const;

function intlLocale(): string {
  return intlLocales[getLocale()];
}

const rupiahOptions: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
};

export function formatRupiah(amount: Rupiah): string {
  return new Intl.NumberFormat(intlLocale(), rupiahOptions).format(amount);
}

/** How the active language groups the digits of a whole number: the character between groups, such as the dot in 100.000.000, and the number of digits in each group after the first, so that a parser can read a number as a person writes it. */
export function digitGrouping(): { separator: string; size: number } {
  const locale = intlLocale();
  // Some languages group the digits of a number only from five digits, so a million shows the groups in every language that has them.
  const million = 1_000_000;
  let separator: string | undefined;
  let lastGroup = "";
  for (const part of new Intl.NumberFormat(locale).formatToParts(million)) {
    if (part.type === "group") {
      separator = part.value;
    }
    if (part.type === "integer") {
      lastGroup = part.value;
    }
  }
  if (separator === undefined) {
    throw new Error(
      `The number format of ${locale} writes a million without a separator of digit groups.`,
    );
  }
  return { separator, size: lastGroup.length };
}

// A number shows at most three decimals, which is also the default of Intl.
const mostNumberDecimals = 3;

/** The smallest step between the marks of an axis whose texts formatNumber writes, so no two marks read the same. */
export const smallestNumberStep = 10 ** -mostNumberDecimals;

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    maximumFractionDigits: mostNumberDecimals,
  }).format(value);
}

/** Formats a size in bytes, such as 128,000 bytes. */
export function formatBytes(size: Bytes): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "unit",
    unit: "byte",
    unitDisplay: "long",
  }).format(size);
}

/** Formats a number of minutes with its unit, short for a badge, such as 10 mnt, or long for a sentence, such as 10 menit. */
export function formatMinutes(
  minutes: number,
  length: "short" | "long",
): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "unit",
    unit: "minute",
    unitDisplay: length,
  }).format(minutes);
}

export function formatIndexLevel(level: IndexPoints): string {
  return new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(level);
}

/** How many decimals a percentage shows: at most two, such as on the marks of an axis, or exactly two, so that the values of a column line up. */
type PercentDecimals = "upToTwo" | "two";

const fewestPercentDecimals: Record<PercentDecimals, number> = {
  upToTwo: 0,
  two: 2,
};
const mostPercentDecimals = 2;

/** The smallest step between the marks of an axis whose texts formatPercent or formatSignedPercent writes, a hundredth of a percent, so no two marks read the same. */
export const smallestPercentStep = 10 ** -(mostPercentDecimals + 2);

/** Formats a fraction such as 0.07 as a percentage without a plus sign, such as 7% with at most two decimals or 7.00% with exactly two. */
export function formatPercent(
  fraction: number,
  decimals: PercentDecimals = "upToTwo",
): string {
  return new Intl.NumberFormat(intlLocale(), percentOptions(decimals)).format(
    fraction,
  );
}

/** How the marks of an axis write their values: as numbers, such as betas, or as percentages of fractions, such as returns. */
export type AxisStyle = "decimal" | "percent";

const axisScales: Record<AxisStyle, { factor: number; mostDecimals: number }> =
  {
    decimal: { factor: 1, mostDecimals: mostNumberDecimals },
    percent: { factor: 100, mostDecimals: mostPercentDecimals },
  };

/** The format of the marks of an axis, which writes each of their values with the same decimals, the fewest that write every one of them exactly, such as 0.0, 0.5, and 1.0, or 0.5% and 1.0%, so the marks line up and none reads rounder than the others. niceTicks never steps finer than smallestNumberStep or smallestPercentStep, so the marks never need more decimals than formatNumber and formatPercent write. */
export function axisMarkFormat(
  values: readonly number[],
  style: AxisStyle,
): (value: number) => string {
  const { factor, mostDecimals } = axisScales[style];
  let decimals = 0;
  for (const value of values) {
    while (
      decimals < mostDecimals &&
      !isWhole(value * factor * 10 ** decimals)
    ) {
      decimals += 1;
    }
  }
  const format = new Intl.NumberFormat(intlLocale(), {
    style,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (value) => format.format(value);
}

// A multiple of a step such as 0.1 is not exact in binary, so a value counts as whole within a millionth.
function isWhole(value: number): boolean {
  return Math.abs(value - Math.round(value)) < 1e-6;
}

function percentOptions(decimals: PercentDecimals): Intl.NumberFormatOptions {
  return {
    style: "percent",
    minimumFractionDigits: fewestPercentDecimals[decimals],
    maximumFractionDigits: mostPercentDecimals,
  };
}

/** Formats a variance or a covariance of monthly returns with four significant digits, such as 0.002732, because it is a square of returns and too small for a percentage. */
export function formatVariance(variance: MonthlyVariance): string {
  return new Intl.NumberFormat(intlLocale(), {
    maximumSignificantDigits: 4,
  }).format(variance);
}

/** Formats a beta with two decimals, such as 0.69. */
export function formatBeta(beta: Beta): string {
  return formatTwoDecimals(beta);
}

/** Formats a correlation with two decimals, such as -0.25. */
export function formatCorrelation(correlation: Correlation): string {
  return formatTwoDecimals(correlation);
}

/** Formats a Sharpe ratio with two decimals, such as -0.17. */
export function formatSharpeRatio(ratio: SharpeRatio): string {
  return formatTwoDecimals(ratio);
}

/** A return difference needs percentage points in the class headline, while its inputs remain fractions. */
export function formatReturnPoints(difference: CumulativeReturn): string {
  return formatTwoDecimals(Math.abs(difference) * 100);
}

function formatTwoDecimals(value: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** How a calendar date reads: in words for a sentence, in words with the day of the week, or with the short month of a table. */
type CalendarDateStyle = "long" | "weekday" | "medium";

const calendarDateOptions: Record<
  CalendarDateStyle,
  Intl.DateTimeFormatOptions
> = {
  long: { dateStyle: "long" },
  // The full style of Bahasa Indonesia writes the day with two digits, such as Senin, 02 November 2026, which no other date of Portolab does.
  weekday: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  medium: { dateStyle: "medium" },
};

/** Formats a calendar date such as 2026-11-02 as a date in words, such as 2 November 2026 in a sentence, with the day of the week, such as Senin, 2 November 2026, or with the short month of a table, such as 2 Nov 2026. */
export function formatCalendarDate(
  date: string,
  style: CalendarDateStyle = "long",
): string {
  return formatUtcDay(startOfUtcDate(date), style);
}

/** Formats the day of a moment in UTC as formatCalendarDate formats a calendar date, such as the day that a field of a date sent, whose year can have more than four digits, such as 7 September 202666. */
export function formatUtcDay(
  moment: Date,
  style: CalendarDateStyle = "long",
): string {
  // A calendar date names a day without a time zone, and the moment is the start of the day in UTC, as startOfUtcDate gives it, so the day is formatted in UTC.
  return new Intl.DateTimeFormat(intlLocale(), {
    ...calendarDateOptions[style],
    timeZone: "UTC",
  }).format(moment);
}

/** Formats a part of a calendar date such as 2026-10-30: the year, such as 2026, or the day with the short month, such as 30 Okt, which a mark on a time axis shows. */
export function formatCalendarDatePart(
  date: string,
  part: "year" | "dayAndMonth",
): string {
  const options: Record<typeof part, Intl.DateTimeFormatOptions> = {
    year: { year: "numeric" },
    dayAndMonth: { day: "numeric", month: "short" },
  };
  // The part is formatted in UTC for the same reason as a calendar date.
  return new Intl.DateTimeFormat(intlLocale(), {
    ...options[part],
    timeZone: "UTC",
  }).format(startOfUtcDate(date));
}

/** Formats the month of a calendar date such as 2027-01-01 in words, such as January 2027. */
export function formatMonth(date: string): string {
  // The month is formatted in UTC for the same reason as a calendar date.
  return new Intl.DateTimeFormat(intlLocale(), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(startOfUtcDate(date));
}

/** The direction that the sign of a change shows, which is none for a change without a sign. */
export type ChangeDirection = "rise" | "fall" | "none";

/** A change as the page shows it, and the direction that its sign shows. */
export interface SignedChange {
  text: string;
  direction: ChangeDirection;
}

/** Formats a fraction such as 0.0081 as a percentage with an explicit sign, such as +0.81% with exactly two decimals, or +2% with at most two on the mark of an axis. The direction comes from the sign that the text shows, so a change that rounds to zero has none. */
export function formatSignedPercent(
  fraction: number,
  decimals: PercentDecimals = "two",
): SignedChange {
  return signedChange(percentOptions(decimals), fraction);
}

/** Formats an amount such as a gain or a loss with an explicit sign, such as +Rp 8.521.000.000, and the direction that the sign shows. */
export function formatSignedRupiah(amount: Rupiah): SignedChange {
  return signedChange(rupiahOptions, amount);
}

function signedChange(
  options: Intl.NumberFormatOptions,
  value: number,
): SignedChange {
  const parts = new Intl.NumberFormat(intlLocale(), {
    ...options,
    signDisplay: "exceptZero",
  }).formatToParts(value);
  let text = "";
  let direction: ChangeDirection = "none";
  for (const part of parts) {
    text += part.value;
    if (part.type === "plusSign") {
      direction = "rise";
    }
    if (part.type === "minusSign") {
      direction = "fall";
    }
  }
  return { text, direction };
}

/** Formats the time of day in WIB, such as 16.14, for a price of the same day as the newest one. */
export function formatMarketClock(moment: Date): string {
  return formatMarketTimeParts(moment).clock;
}

/** Joins items into a list for the active language, with "and" such as "BBRI, TLKM, and ASII", or with "or" for a choice, such as "BBRI, TLKM, or ASII". */
export function formatList(
  items: readonly string[],
  type: "conjunction" | "disjunction",
): string {
  return listOfWords(items, type, intlLocale());
}

export function formatMarketTime(moment: Date): string {
  return marketTimeFormat().format(moment);
}

/** Formats a moment in WIB as formatMarketTime does, split where the time of day starts, so a layout can put the time on a line of its own. The date keeps the separator that the active language writes before the time. */
export function formatMarketTimeParts(moment: Date): {
  date: string;
  clock: string;
} {
  let date = "";
  let clock = "";
  let hasClockStarted = false;
  for (const part of marketTimeFormat().formatToParts(moment)) {
    if (part.type === "hour") {
      hasClockStarted = true;
    }
    if (hasClockStarted) {
      clock += part.value;
    } else {
      date += part.value;
    }
  }
  return { date, clock };
}

function marketTimeFormat(): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: wibTimeZone,
  });
}
