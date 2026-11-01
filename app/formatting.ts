import { getLocale } from "~/paraglide/runtime.js";
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

export function formatIndexLevel(level: number): string {
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
  return new Intl.DateTimeFormat(intlLocale(), {
    timeStyle: "short",
    timeZone: wibTimeZone,
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
    timeZone: wibTimeZone,
  }).format(moment);
}
