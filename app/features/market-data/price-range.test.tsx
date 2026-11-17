import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { PriceRange } from "./price-range";

const widest: Record<Locale, string> = {
  id: "9.007.199.254.740.991 sampai 9.007.199.254.740.991",
  en: "9,007,199,254,740,991 to 9,007,199,254,740,991",
};

for (const locale of locales) {
  test(`places the mark at each bound and centres a range with one price in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [low, high, marker] of [
      [4980, 5025, "0%"],
      [4900, 4980, "100%"],
      [4980, 4980, "50%"],
    ] as const) {
      const html = renderInRouterForTest(
        <PriceRange
          low={rupiah(low)}
          high={rupiah(high)}
          latest={rupiah(4980)}
        />,
      );
      expect(html).toContain(`x1="${marker}"`);
      expect(html).toContain(`x2="${marker}"`);
    }
  });

  test(`formats the largest whole-rupiah bounds in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const largest = rupiah(Number.MAX_SAFE_INTEGER);
    const html = renderInRouterForTest(
      <PriceRange low={largest} high={largest} latest={largest} />,
    );
    expect(html).toContain(`aria-label="${widest[locale]}"`);
    expect(html).toContain('x1="50%"');
  });
}
