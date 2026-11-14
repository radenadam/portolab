import { expect, test } from "vitest";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { valuationForTest } from "~/features/measures/measures-for-test.server";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { shares } from "~/units/shares";
import { StockPosition } from "./stock-position";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Harga rata-rata",
    "Harga rata-rata membagi biaya saham yang masih Anda miliki, termasuk biaya broker pembelian, dengan jumlah lembarnya.",
    "Rp 27.431.085 / 5.500 saham = Rp 4.987 per lembar, dibulatkan ke rupiah terdekat.",
    "Laba atau rugi belum terealisasi adalah nilai saham pada harga tertunda dikurangi biaya pembeliannya, termasuk biaya broker.",
    "Rp 27.390.000 − Rp 27.431.085 = -Rp 41.085.",
    "Rp 4.987",
    "Rp 27.390.000",
    "-Rp 41.085",
    "-0,15%",
  ],
  en: [
    "Average cost",
    "Average cost divides the cost of the shares you still hold, including purchase broker fees, by their share count.",
    "IDR 27,431,085 / 5,500 shares = IDR 4,987 per share, rounded to the nearest rupiah.",
    "Unrealised profit or loss is the value of the shares at the delayed price less their purchase cost, including broker fees.",
    "IDR 27,390,000 − IDR 27,431,085 = -IDR 41,085.",
    "IDR 4,987",
    "IDR 27,390,000",
    "-IDR 41,085",
    "-0.15%",
  ],
};

for (const locale of locales) {
  test(`explains average purchase cost and unrealised gain in ${locale}`, () => {
    switchLocaleForTest(locale);
    const holding = valuationForTest(["BBCA", "TLKM"]).holdings[0];
    if (holding === undefined) throw new Error("The fixture holds BBCA.");
    const html = renderInRouterForTest(
      <StockPosition holding={holding} lotShares={shares(100)} />,
      conceptLessonDataForTest(),
    ).replaceAll("\u00a0", " ");
    // Python's decimal module independently computed Rp4,987 per share and a loss of Rp41,085 or 0.149775% of cost.
    for (const expected of texts[locale]) {
      expect(html).toContain(markupTextForTest(expected));
    }
  });
}
