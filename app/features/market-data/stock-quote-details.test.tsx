import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { StockQuoteDetails } from "./stock-quote-details";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { parseRecordId } from "~/value-parsers";

const texts: Record<Locale, { quote: string; portfolio: string }> = {
  id: {
    quote: "30 Okt 2026, 16.14 · penutupan sebelumnya Rp 4.940",
    portfolio: "Waktu harga portofolio di Beranda",
  },
  en: {
    quote: "Oct 30, 2026, 4:14 PM · previous close IDR 4,940",
    portfolio: "Portfolio quote times in Home",
  },
};

for (const locale of locales) {
  test(`keeps portfolio quote times reachable with and without this stock's latest quote in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const classId = parseRecordId<ClassId>("1", "classId");
    if (!classId.ok) throw new Error(classId.failure);
    // The history can support correlation while the latest quote of an unheld stock is missing.
    for (const hasQuote of [false, true]) {
      for (const hasPortfolioQuotes of [false, true]) {
        const html = renderInRouterForTest(
          <StockQuoteDetails
            classId={classId.value}
            quote={
              hasQuote
                ? {
                    quotedAt: new Date("2026-10-30T09:14:55Z"),
                    previousClose: rupiah(4940),
                  }
                : undefined
            }
            hasPortfolioQuotes={hasPortfolioQuotes}
          />,
        ).replaceAll("\u00a0", " ");
        expect(html.includes(texts[locale].quote)).toBe(hasQuote);
        expect(html.includes(texts[locale].portfolio)).toBe(hasPortfolioQuotes);
        expect(html.includes("/classes/1#home-holdings-heading")).toBe(
          hasPortfolioQuotes,
        );
      }
    }
  });
}
