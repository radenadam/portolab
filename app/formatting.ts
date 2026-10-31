import { getLocale } from "~/paraglide/runtime.js";
import type { Rupiah } from "~/units/rupiah";

// Indonesia has no daylight saving time, and IDX publishes every time in WIB.
const marketTimeZone = "Asia/Jakarta";

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

export function formatIndexLevel(level: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(level);
}

/** Formats a fraction such as 0.0081 as a percentage with an explicit sign, such as +0.81%. */
export function formatSignedPercent(fraction: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(fraction);
}

/** Formats the time of day in WIB, such as 16.14, for a price of the same day as the newest one. */
export function formatMarketClock(moment: Date): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    timeStyle: "short",
    timeZone: marketTimeZone,
  }).format(moment);
}

/** Joins items into a list for the active language, such as "BBRI, TLKM, and ASII" or "BBRI, TLKM, dan ASII". */
export function formatList(items: readonly string[]): string {
  return new Intl.ListFormat(intlLocale(), { type: "conjunction" }).format(
    items,
  );
}

export function formatMarketTime(moment: Date): string {
  return new Intl.DateTimeFormat(intlLocale(), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: marketTimeZone,
  }).format(moment);
}
