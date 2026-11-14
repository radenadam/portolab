import { expect, test } from "vitest";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { StockMetadata } from "./stock-metadata";

const texts: Record<Locale, { sector: string; member: string; held: string }> =
  {
    id: {
      sector: "Keuangan",
      member: " · LQ45",
      held: " · ada di portofolio Anda",
    },
    en: {
      sector: "Financials",
      member: " · LQ45",
      held: " · held in your portfolio",
    },
  };
for (const locale of locales) {
  test(`puts the sector, current membership, and holding on one metadata line in ${locale}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
    for (const held of [false, true])
      for (const isLq45 of [false, true]) {
        expect(
          renderTextMarkupForTest(
            <StockMetadata code="BBCA" held={held} isLq45={isLq45} />,
          ),
        ).toBe(
          text.sector + (isLq45 ? text.member : "") + (held ? text.held : ""),
        );
      }
  });
}
