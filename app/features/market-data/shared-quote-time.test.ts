import { expect, test } from "vitest";
import { formatMarketTime } from "~/formatting";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { ownQuoteTime, sharedQuoteTime } from "./shared-quote-time";
import { stockQuote } from "./stock-quote";

const first = stockQuote("BBCA", [4980, 4940], "2026-10-30T09:14:55Z");
const second = stockQuote("TLKM", [1980, 1980], "2026-10-30T09:14:58Z");
const earlier = stockQuote("ANTM", [2620, 2670], "2026-10-30T09:13:30Z");
const older = stockQuote("BMRI", [3720, 3720], "2026-10-29T09:14:58Z");

test("shares the time that most quotes show, and of times that as many quotes show, the latest", () => {
  const sharedText = (quotes: Parameters<typeof sharedQuoteTime>[0]) => {
    const shared = sharedQuoteTime(quotes);
    return shared === undefined ? undefined : formatMarketTime(shared);
  };
  expect(sharedText([first, undefined, second, older])).toBe(
    formatMarketTime(first.quotedAt),
  );
  expect(sharedText([older, older, older, first, second])).toBe(
    formatMarketTime(older.quotedAt),
  );
  expect(sharedText([older, first, older, second])).toBe(
    formatMarketTime(first.quotedAt),
  );
  expect(sharedText([earlier, older, first])).toBe(
    formatMarketTime(first.quotedAt),
  );
  expect(sharedText([older])).toBe(formatMarketTime(older.quotedAt));
  expect(sharedQuoteTime([undefined])).toBeUndefined();
  expect(sharedQuoteTime([])).toBeUndefined();
});

const ownTimes: Record<
  Locale,
  { sameDay: string; otherDay: string; unshared: string }
> = {
  id: {
    sameDay: "16.13 WIB",
    otherDay: "29 Okt 2026, 16.14 WIB",
    unshared: "30 Okt 2026, 16.13 WIB",
  },
  en: {
    sameDay: "4:13 PM WIB",
    otherDay: "Oct 29, 2026, 4:14 PM WIB",
    unshared: "Oct 30, 2026, 4:13 PM WIB",
  },
};

for (const locale of locales) {
  test(`writes no time beside a price of the shared minute, the time of day for another minute of its date, and the date for another day or without a shared time, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const shared = sharedQuoteTime([first, second, earlier]);
    expect(ownQuoteTime(second.quotedAt, shared)).toBeUndefined();
    expect(ownQuoteTime(earlier.quotedAt, shared)).toBe(
      ownTimes[locale].sameDay,
    );
    expect(ownQuoteTime(older.quotedAt, shared)).toBe(
      ownTimes[locale].otherDay,
    );
    expect(ownQuoteTime(earlier.quotedAt, undefined)).toBe(
      ownTimes[locale].unshared,
    );
  });
}
