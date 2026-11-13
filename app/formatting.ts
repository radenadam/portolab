import { startOfUtcDate } from "~/calendar-dates";
import { getLocale } from "~/paraglide/runtime.js";
import { listOfWords } from "~/sentences";
import type { Beta } from "~/units/beta";
import type { Bytes } from "~/units/bytes";
import type { Correlation } from "~/units/correlation";
import type { IndexPoints } from "~/units/index-points";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { Rupiah } from "~/units/rupiah";
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

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(intlLocale()).format(value);
}

/** Formats a size in bytes, such as 128,000 bytes. */
export function formatBytes(size: Bytes): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "unit",
    unit: "byte",
    unitDisplay: "long",
  }).format(size);
}

export function formatIndexLevel(level: IndexPoints): string {
  return new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(level);
}

/** How many decimals a percentage shows: at most two, or exactly two, so that the values of a column of measures line up. */
type PercentDecimals = "upToTwo" | "two";

const fewestPercentDecimals: Record<PercentDecimals, number> = {
  upToTwo: 0,
  two: 2,
};

/** Formats a fraction such as 0.07 as a percentage without a plus sign, such as 7% with at most two decimals or 7.00% with exactly two. */
export function formatPercent(
  fraction: number,
  decimals: PercentDecimals = "upToTwo",
): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "percent",
    minimumFractionDigits: fewestPercentDecimals[decimals],
    maximumFractionDigits: 2,
  }).format(fraction);
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
  // A calendar date names a day without a time zone, and startOfUtcDate gives the start of that day in UTC, so the date is formatted in UTC.
  return new Intl.DateTimeFormat(intlLocale(), {
    ...calendarDateOptions[style],
    timeZone: "UTC",
  }).format(startOfUtcDate(date));
}

/** Formats one part of a calendar date such as 2026-10-30, which a mark on a time axis shows: the year, such as 2026, the month, such as Okt, or the day, such as 30. */
export function formatCalendarDatePart(
  date: string,
  part: "year" | "month" | "day",
): string {
  const options: Record<typeof part, Intl.DateTimeFormatOptions> = {
    year: { year: "numeric" },
    month: { month: "short" },
    day: { day: "numeric" },
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

/** Formats a fraction such as 0.0081 as a percentage with an explicit sign, such as +0.81%. The direction comes from the sign that the text shows, so a change that rounds to zero has none. */
export function formatSignedPercent(fraction: number): SignedChange {
  return signedChange(
    {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
    fraction,
  );
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
