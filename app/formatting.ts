import { getLocale } from "~/paraglide/runtime.js";
import { listOfWords } from "~/sentences";
import type { IndexPoints } from "~/units/index-points";
import type { Rupiah } from "~/units/rupiah";
import { wibTimeZone } from "~/wib";

const intlLocales = { id: "id-ID", en: "en-US" } as const;

function intlLocale(): string {
  return intlLocales[getLocale()];
}

export function formatRupiah(amount: Rupiah): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(intlLocale()).format(value);
}

export function formatIndexLevel(level: IndexPoints): string {
  return new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(level);
}

/** The direction that the sign of a change shows, which is none for a change without a sign. */
export type ChangeDirection = "rise" | "fall" | "none";

/** A change as the page shows it, and the direction that its sign shows. */
interface SignedPercent {
  text: string;
  direction: ChangeDirection;
}

/** Formats a fraction such as 0.0081 as a percentage with an explicit sign, such as +0.81%. The direction comes from the sign that the text shows, so a change that rounds to zero has none. */
export function formatSignedPercent(fraction: number): SignedPercent {
  const parts = new Intl.NumberFormat(intlLocale(), {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).formatToParts(fraction);
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
