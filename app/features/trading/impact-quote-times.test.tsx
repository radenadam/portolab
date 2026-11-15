import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { shares } from "~/units/shares";
import { tradePortfolioForTest } from "./trade-portfolio-for-test.server";
import { ImpactQuoteTimes } from "./impact-quote-times";

const texts: Record<Locale, { one: string; several: string; time: string }> = {
  id: {
    one: "Waktu harga TLKM:",
    several: "Waktu harga BBCA dan TLKM:",
    time: "29 Okt 2026, 16.14 WIB",
  },
  en: {
    one: "Price time for TLKM:",
    several: "Price time for BBCA and TLKM:",
    time: "Oct 29, 2026, 4:14 PM WIB",
  },
};

for (const locale of locales) {
  test(`keeps exceptions to the ticket's quote time visible and groups matching times in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { ticket } = await tradePortfolioForTest();
    if (ticket.quote === undefined) throw new Error("The fixture has BBCA.");
    const quotedAt = ticket.quote.quotedAt;
    const { stocks } = successValueForTest(
      ticket.impact,
      "The holdings are priced",
    );
    const render = (values: typeof stocks) =>
      renderMarkupForTest(
        <ImpactQuoteTimes stocks={values} quotedAt={quotedAt} />,
      );
    expect(render(stocks)).toBe("");
    const earlier = new Date("2026-10-29T09:14:00.000Z");
    const one = stocks.map((stock) => ({
      ...stock,
      quotedAt: stock.code === "TLKM" ? earlier : stock.quotedAt,
    }));
    expect(render(one)).toContain(markupTextForTest(texts[locale].one));
    const several = stocks.map((stock) => ({ ...stock, quotedAt: earlier }));
    const grouped = render(several);
    expect(grouped).toContain(markupTextForTest(texts[locale].several));
    expect(grouped).toContain(markupTextForTest(texts[locale].time));
    expect(grouped.match(/<li>/g)).toHaveLength(1);
    expect(render(one.map((stock) => ({ ...stock, shares: shares(0) })))).toBe(
      "",
    );
  });
}
