import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { monthlyReturn } from "~/units/monthly-return";
import { diversificationNumbers } from "./diversification-numbers";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Rata-rata tertimbang risiko aset Anda 3,00% per bulan, sedangkan risiko portofolionya 2,00%. Selisihnya 1,00 poin persentase.",
    "Rata-rata tertimbang risiko aset Anda 3,00% per bulan, sedangkan risiko portofolionya 3,00%. Selisihnya 0,00 poin persentase.",
  ],
  en: [
    "Your weighted average asset risk is 3.00% per month, while portfolio risk is 2.00%. The difference is 1.00 percentage point.",
    "Your weighted average asset risk is 3.00% per month, while portfolio risk is 3.00%. The difference is 0.00 percentage points.",
  ],
};

for (const locale of locales) {
  test(`uses the displayed point count and removes a negative rounding residue in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // By hand, 3% minus 2% is one percentage point. The adjacent inputs round to the same figures, and an equal-risk sum can leave a negative floating-point residue.
    for (const [risk, expected] of [
      [0.02, 0],
      [0.0199999, 0],
      [0.03000000000000001, 1],
    ] as const)
      expect(
        diversificationNumbers({
          average: monthlyReturn(0.03),
          risk: monthlyReturn(risk),
        }),
      ).toBe(texts[locale][expected]);
  });
}
