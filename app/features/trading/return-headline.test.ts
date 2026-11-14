import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { cumulativeReturn } from "~/units/cumulative-return";
import { returnHeadline } from "./return-headline";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Unggul 3,61 poin dari IHSG",
    "Tertinggal 3,61 poin dari IHSG",
    "Setara dengan IHSG",
    "Unggul 1,00 poin dari IHSG",
    "Tertinggal 1,00 poin dari IHSG",
  ],
  en: [
    "Ahead of the IHSG by 3.61 points",
    "Behind the IHSG by 3.61 points",
    "Level with the IHSG",
    "Ahead of the IHSG by 1.00 point",
    "Behind the IHSG by 1.00 point",
  ],
};

for (const locale of locales) {
  test(`chooses ahead, behind, and level from the difference after rounding in ${locale}`, () => {
    switchLocaleForTest(locale);
    // By hand, 1.86% minus -1.75% gives 3.61 percentage points. A difference of 0.004 points rounds to zero in either direction.
    for (const [portfolio, market, index] of [
      [0.0186, -0.0175, 0],
      [-0.0175, 0.0186, 1],
      [0.00004, 0, 2],
      [-0.00004, 0, 2],
      [0, 0, 2],
      [0.0099999, 0, 3],
      [-0.0099999, 0, 4],
    ] as const) {
      expect(
        returnHeadline(cumulativeReturn(portfolio), cumulativeReturn(market)),
      ).toBe(texts[locale][index]);
    }
  });
}
