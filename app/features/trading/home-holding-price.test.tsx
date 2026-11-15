import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { expect, test } from "vitest";
import { stockQuote } from "~/features/market-data/stock-quote";
import { valuationForTest } from "~/features/measures/measures-for-test.server";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { HomeHoldingPrice } from "./home-holding-price";
import { valuePortfolio } from "./value-portfolio";

const times: Record<Locale, readonly [string, string]> = {
  id: ["30 Okt 2026, 16.14", "29 Okt 2026, 16.14 WIB."],
  en: ["Oct 30, 2026, 4:14 PM", "Oct 29, 2026, 4:14 PM WIB."],
};

for (const locale of locales) {
  test(`shares the displayed quote minute and keeps a different date beside its price in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const valuation = valuationForTest(["BBCA", "TLKM"]);
    const shared = times[locale][0];
    for (const holding of valuation.holdings)
      expect(
        renderTextMarkupForTest(
          <HomeHoldingPrice
            holding={holding}
            failed={false}
            sharedTime={shared}
          />,
        ),
      ).not.toContain(times[locale][0]);
    const older = valuePortfolio(
      {
        cash: rupiah(0),
        holdings: [
          { code: "BMRI", shares: shares(100), cost: rupiah(372_558) },
        ],
      },
      rupiah(372_558),
      new Map([
        ["BMRI", stockQuote("BMRI", [3720, 3720], "2026-10-29T09:14:58Z")],
      ]),
    ).holdings;
    for (const holding of older)
      expect(
        renderTextMarkupForTest(
          <HomeHoldingPrice
            holding={holding}
            failed={false}
            sharedTime={shared}
          />,
        ),
      ).toContain(markupTextForTest(times[locale][1]));
    for (const holding of valuation.holdings)
      expect(
        renderTextMarkupForTest(
          <HomeHoldingPrice holding={holding} failed={false} />,
        ),
      ).toContain(times[locale][0]);
  });
}
