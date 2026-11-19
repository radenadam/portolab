import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { StockQuoteDetails } from "./stock-quote-details";

const quote = {
  quotedAt: new Date("2026-10-30T09:14:55Z"),
  previousClose: rupiah(4940),
};
const portfolioQuotes = [
  { code: "BBCA", quotedAt: new Date("2026-10-30T09:14:58Z") },
  { code: "TLKM", quotedAt: new Date("2026-10-30T09:14:30Z") },
  { code: "ANTM", quotedAt: new Date("2026-10-30T09:13:30Z") },
];

const texts: Record<Locale, { quote: string; shared: string; label: string }> =
  {
    id: {
      quote: "30 Okt 2026, 16.14 WIB · penutupan sebelumnya Rp 4.940",
      shared: "Harga 30 Okt 2026, 16.14 WIB.",
      label: "Waktu harga",
    },
    en: {
      quote: "Oct 30, 2026, 4:14 PM WIB · previous close IDR 4,940",
      shared: "Prices Oct 30, 2026, 4:14 PM WIB.",
      label: "Price time",
    },
  };

for (const locale of locales) {
  test(`states the time of the price of the stock, or the time that the holdings share without it, and leaves the holdings of another time to the values beside them, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const render = (props: Parameters<typeof StockQuoteDetails>[0]) =>
      renderTextMarkupForTest(<StockQuoteDetails {...props} />).replaceAll(
        " ",
        " ",
      );
    const alone = render({ quote, portfolioQuotes: [] });
    expect(alone).toContain(markupTextForTest(texts[locale].quote));
    expect(alone).not.toContain(texts[locale].label);
    const withHoldings = render({ quote, portfolioQuotes });
    expect(withHoldings).toContain(markupTextForTest(texts[locale].quote));
    expect(withHoldings).not.toContain(texts[locale].label);
    // The history can support a correlation while the latest quote of a stock that the reader does not hold is missing.
    const withoutQuote = render({ quote: undefined, portfolioQuotes });
    expect(withoutQuote).toContain(markupTextForTest(texts[locale].shared));
    expect(withoutQuote).not.toContain(texts[locale].label);
    expect(
      renderMarkupForTest(
        <StockQuoteDetails quote={undefined} portfolioQuotes={[]} />,
      ),
    ).toBe("");
  });
}
