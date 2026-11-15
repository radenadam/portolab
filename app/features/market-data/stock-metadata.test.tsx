import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { StockMetadata } from "./stock-metadata";

const texts: Record<Locale, readonly [string, string, string, string]> = {
  id: [
    "Keuangan",
    "Keuangan · LQ45",
    "Keuangan · ada di portofolio Anda",
    "Keuangan · LQ45 · ada di portofolio Anda",
  ],
  en: [
    "Financials",
    "Financials · LQ45",
    "Financials · held in your portfolio",
    "Financials · LQ45 · held in your portfolio",
  ],
};
const states = [
  [false, false],
  [false, true],
  [true, false],
  [true, true],
] as const;
for (const locale of locales) {
  test(`puts the sector, current membership, and holding on one metadata line in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [index, [held, isLq45]] of states.entries()) {
      expect(
        renderTextMarkupForTest(
          <StockMetadata code="BBCA" held={held} isLq45={isLq45} />,
        ),
      ).toBe(texts[locale][index]);
    }
  });
}
