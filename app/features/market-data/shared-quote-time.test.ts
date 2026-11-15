import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { sharedQuoteTime } from "./shared-quote-time";
import { stockQuote } from "./stock-quote";

const times: Record<Locale, readonly [string, string]> = {
  id: ["30 Okt 2026, 16.14", "29 Okt 2026, 16.14"],
  en: ["Oct 30, 2026, 4:14 PM", "Oct 29, 2026, 4:14 PM"],
};

for (const locale of locales) {
  test(`shares the most frequent displayed quote minute and preserves its date in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const first = stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55Z");
    const second = stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:58Z");
    const older = stockQuote("BMRI", [3720, 3720], "2026-10-29T09:14:58Z");
    expect(sharedQuoteTime([first, undefined, second, older])).toBe(
      times[locale][0],
    );
    expect(sharedQuoteTime([older, older, older, first, second])).toBe(
      times[locale][1],
    );
    expect(sharedQuoteTime([older, first, older, second])).toBe(
      times[locale][1],
    );
    expect(sharedQuoteTime([first, older])).toBeUndefined();
    expect(sharedQuoteTime([first])).toBeUndefined();
    expect(sharedQuoteTime([undefined])).toBeUndefined();
    expect(sharedQuoteTime([])).toBeUndefined();
  });
}
