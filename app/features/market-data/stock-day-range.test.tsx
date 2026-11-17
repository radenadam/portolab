import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { StockDayRange } from "./stock-day-range";
import { readStockDayRange } from "./read-stock-day-range.server";
import type { StockQuote } from "./price-source.server";
import { stockQuote } from "./stock-quote";

const texts: Record<
  Locale,
  {
    label: string;
    today: string;
    meaning: string;
    example: string;
    range: string;
    missing: string;
  }
> = {
  id: {
    label: "Rentang harian",
    today: "Rentang hari ini",
    meaning:
      "Harga terendah dan tertinggi pada hari bursa kutipan sampai harga tertunda terakhir, dengan garis pada harga tersebut.",
    example:
      "Rentang BBCA pada 30 Okt 2026, 16.14 WIB adalah 4.900 sampai 5.025 rupiah per lembar.",
    range: "4.900 sampai 5.025",
    missing:
      "Portolab belum memiliki harga terendah dan tertinggi harian BBCA. Periksa kembali setelah pembaruan harga membawa keduanya.",
  },
  en: {
    label: "Day range",
    today: "Today's range",
    meaning:
      "The lowest and highest prices on the quote's trading day up to its latest delayed price, with the mark at that price.",
    example:
      "The range of BBCA at Oct 30, 2026, 4:14 PM WIB is 4,900 to 5,025 rupiah per share.",
    range: "4,900 to 5,025",
    missing:
      "Portolab has no recorded daily low and high for BBCA yet. Check again when a price update supplies both.",
  },
};

const recordedQuote = stockQuote(
  "BBCA",
  [4980, 4940, [4900, 5025]],
  "2026-10-30T09:14:55Z",
);

function renderDayRange(quote: StockQuote | undefined, now: Date): string {
  return renderInRouterForTest(
    <dl>
      <StockDayRange text={readStockDayRange("BBCA", quote, now)} />
    </dl>,
    conceptLessonDataForTest(),
  );
}

for (const locale of locales) {
  test(`explains recorded bounds and unavailable ranges with and without a quote in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const render = (value: StockQuote | undefined) =>
      renderDayRange(value, new Date("2026-11-17T03:00:00Z"));
    const quote = recordedQuote;
    const html = render(quote);
    for (const expected of [
      texts[locale].label,
      texts[locale].meaning,
      texts[locale].example,
      texts[locale].range,
    ]) {
      expect(html).toContain(markupTextForTest(expected));
    }
    // (4980 - 4900) / (5025 - 4900) is 64 percent by hand.
    expect(html).toContain('x1="64%"');
    expect(html).toContain('x2="64%"');
    for (const missing of [undefined, { ...quote, dayRange: undefined }]) {
      expect(render(missing)).toContain(
        markupTextForTest(texts[locale].missing),
      );
    }
  });
  test(`names today only while the quote belongs to that WIB date in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [now, sameDay] of [
      [new Date("2026-10-30T16:59:59.999Z"), true],
      [new Date("2026-10-30T17:00:00Z"), false],
    ] as const) {
      for (const quote of [
        recordedQuote,
        { ...recordedQuote, dayRange: undefined },
        undefined,
      ]) {
        const expected =
          quote !== undefined && sameDay
            ? texts[locale].today
            : texts[locale].label;
        expect(readStockDayRange("BBCA", quote, now).label).toBe(expected);
        expect(renderDayRange(quote, now)).toContain(
          markupTextForTest(expected),
        );
      }
    }
  });
}
