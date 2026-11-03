import { expect, test } from "vitest";
import {
  formatBytes,
  formatCalendarDate,
  formatCalendarDatePart,
  formatMarketTime,
  formatMarketTimeParts,
  formatSignedRupiah,
} from "./formatting";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { bytes } from "./units/bytes";
import { rupiah } from "./units/rupiah";

// 09:14:56 UTC on 16 October 2026 is 16:14 WIB.
const quotedAt = new Date("2026-10-16T09:14:56.000Z");

const sizes: Record<Locale, string> = {
  id: "128.040 byte",
  en: "128,040 bytes",
};

const parts: Record<Locale, { date: string; clock: string }> = {
  id: { date: "16 Okt 2026, ", clock: "16.14" },
  en: { date: "Oct 16, 2026, ", clock: "4:14 PM" },
};

for (const locale of locales) {
  test(`splits a moment where the time of day starts, with the separator of the language, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const split = formatMarketTimeParts(quotedAt);
    expect(split).toEqual(parts[locale]);
    expect(split.date + split.clock).toBe(formatMarketTime(quotedAt));
  });
}

for (const locale of locales) {
  test(`formats a size in bytes in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(formatBytes(bytes(128_040))).toBe(sizes[locale]);
  });
}

const signedAmounts: Record<
  Locale,
  { gain: string; loss: string; none: string }
> = {
  id: {
    gain: "+Rp\u00a08.521.000",
    loss: "-Rp\u00a01.474.700",
    none: "Rp\u00a00",
  },
  en: {
    gain: "+IDR\u00a08,521,000",
    loss: "-IDR\u00a01,474,700",
    none: "IDR\u00a00",
  },
};

const dates: Record<
  Locale,
  { long: string; medium: string; year: string; month: string; day: string }
> = {
  id: {
    long: "30 Oktober 2026",
    medium: "30 Okt 2026",
    year: "2026",
    month: "Okt",
    day: "30",
  },
  en: {
    long: "October 30, 2026",
    medium: "Oct 30, 2026",
    year: "2026",
    month: "Oct",
    day: "30",
  },
};

for (const locale of locales) {
  test(`formats a gain and a loss with their signs and directions, and an amount of zero without either, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = signedAmounts[locale];
    expect(formatSignedRupiah(rupiah(8_521_000))).toEqual({
      text: text.gain,
      direction: "rise",
    });
    expect(formatSignedRupiah(rupiah(-1_474_700))).toEqual({
      text: text.loss,
      direction: "fall",
    });
    expect(formatSignedRupiah(rupiah(0))).toEqual({
      text: text.none,
      direction: "none",
    });
  });

  test(`formats a calendar date in a sentence, in a table, and in the parts that a time axis shows, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = dates[locale];
    expect(formatCalendarDate("2026-10-30")).toBe(text.long);
    expect(formatCalendarDate("2026-10-30", "medium")).toBe(text.medium);
    expect(formatCalendarDatePart("2026-10-30", "year")).toBe(text.year);
    expect(formatCalendarDatePart("2026-10-30", "month")).toBe(text.month);
    expect(formatCalendarDatePart("2026-10-30", "day")).toBe(text.day);
  });
}
