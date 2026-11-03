import { expect, test } from "vitest";
import {
  formatKilobytes,
  formatMarketTime,
  formatMarketTimeParts,
} from "./formatting";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { bytes } from "./units/bytes";

// 09:14:56 UTC on 16 October 2026 is 16:14 WIB.
const quotedAt = new Date("2026-10-16T09:14:56.000Z");

const sizes: Record<Locale, string> = { id: "1.500 kB", en: "1,500 kB" };

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
  test(`formats a size in kilobytes of 1,000 bytes in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(formatKilobytes(bytes(1_500_000))).toBe(sizes[locale]);
  });
}
