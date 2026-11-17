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
import { stockQuote } from "./stock-quote";

const texts: Record<
  Locale,
  {
    label: string;
    meaning: string;
    example: string;
    range: string;
    missing: string;
  }
> = {
  id: {
    label: "Rentang hari ini",
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
    meaning:
      "The lowest and highest prices on the quote's trading day up to its latest delayed price, with the mark at that price.",
    example:
      "The range of BBCA at Oct 30, 2026, 4:14 PM WIB is 4,900 to 5,025 rupiah per share.",
    range: "4,900 to 5,025",
    missing:
      "Portolab has no recorded daily low and high for BBCA yet. Check again when a price update supplies both.",
  },
};

for (const locale of locales) {
  test(`explains recorded bounds and unavailable ranges with and without a quote in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const quote = stockQuote(
      "BBCA",
      [4980, 4940, [4900, 5025]],
      "2026-10-30T09:14:55Z",
    );
    const render = (value: typeof quote | undefined) =>
      renderInRouterForTest(
        <dl>
          <StockDayRange text={readStockDayRange("BBCA", value)} />
        </dl>,
        conceptLessonDataForTest(),
      );
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
}
