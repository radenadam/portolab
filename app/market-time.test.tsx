import { expect, test } from "vitest";
import { languageNames } from "./language-names";
import { MarketTime } from "./market-time";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { renderMarkupForTest } from "./render-markup-for-test";
import { switchLocaleForTest } from "./switch-locale-for-test";

const text: Record<Locale, { date: string; clock: string }> = {
  id: { date: "2 Nov 2026, ", clock: "09.50 WIB" },
  en: { date: "Nov 2, 2026, ", clock: "9:50 AM WIB" },
};
for (const locale of locales) {
  test(`keeps the clock with WIB while its date may wrap in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      renderMarkupForTest(
        <MarketTime moment={new Date("2026-11-02T02:50:00Z")} />,
      ),
    ).toBe(
      `<time dateTime="2026-11-02T02:50:00.000Z">${text[locale].date}<span>${text[locale].clock}</span></time>`,
    );
  });
}
