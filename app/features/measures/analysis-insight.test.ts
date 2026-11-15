import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { monthlyReturn } from "~/units/monthly-return";
import {
  analysisAlphaInsight,
  analysisDiversificationInsight,
} from "./analysis-insight";

const texts: Record<
  Locale,
  { alpha: readonly string[]; diversification: readonly string[] }
> = {
  id: {
    alpha: [
      "Portofolio Anda di atas garis sejauh 0,03 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Anda di bawah garis sejauh 0,03 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Anda tepat di garis. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Anda di atas garis sejauh 1,00 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Anda di bawah garis sejauh 1,00 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
    ],
    diversification: [
      "Diversifikasi menurunkan risiko dari 5,00% ke 4,00% dengan imbal hasil harapan yang sama.",
      "Risiko portofolio 5,00% sama dengan rata-rata tertimbang risiko saham 5,00%.",
    ],
  },
  en: {
    alpha: [
      "Your portfolio is 0.03 points per month above the line. Select a point to see its alpha calculation.",
      "Your portfolio is 0.03 points per month below the line. Select a point to see its alpha calculation.",
      "Your portfolio is on the line. Select a point to see its alpha calculation.",
      "Your portfolio is 1.00 point per month above the line. Select a point to see its alpha calculation.",
      "Your portfolio is 1.00 point per month below the line. Select a point to see its alpha calculation.",
    ],
    diversification: [
      "Diversification lowers risk from 5.00% to 4.00% at the same expected return.",
      "Portfolio risk of 5.00% equals the weighted average stock risk of 5.00%.",
    ],
  },
};

const studentTexts: Record<Locale, { alpha: readonly string[] }> = {
  id: {
    alpha: [
      "Portofolio Raka di atas garis sejauh 0,03 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Raka di bawah garis sejauh 0,03 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Raka tepat di garis. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Raka di atas garis sejauh 1,00 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
      "Portofolio Raka di bawah garis sejauh 1,00 poin per bulan. Pilih titik untuk melihat perhitungan alphanya.",
    ],
  },
  en: {
    alpha: [
      "The portfolio of Raka is 0.03 points per month above the line. Select a point to see its alpha calculation.",
      "The portfolio of Raka is 0.03 points per month below the line. Select a point to see its alpha calculation.",
      "The portfolio of Raka is on the line. Select a point to see its alpha calculation.",
      "The portfolio of Raka is 1.00 point per month above the line. Select a point to see its alpha calculation.",
      "The portfolio of Raka is 1.00 point per month below the line. Select a point to see its alpha calculation.",
    ],
  },
};

for (const locale of locales) {
  test(`describes alpha after rounding, including one point, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [value, index] of [
      [0.0003, 0],
      [-0.0003, 1],
      [0, 2],
      [0.00004, 2],
      [-0.00004, 2],
      [0.0099999, 3],
      [-0.0099999, 4],
    ] as const) {
      for (const studentName of [undefined, "Raka"])
        expect(
          analysisAlphaInsight(monthlyReturn(value), studentName).text,
        ).toBe(
          (studentName === undefined ? texts : studentTexts)[locale].alpha[
            index
          ],
        );
    }
  });
  test(`describes diversification and equal rounded risk in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      analysisDiversificationInsight(monthlyReturn(0.05), monthlyReturn(0.04))
        .text,
    ).toBe(texts[locale].diversification[0]);
    expect(
      analysisDiversificationInsight(
        monthlyReturn(0.05),
        monthlyReturn(0.0499999),
      ).text,
    ).toBe(texts[locale].diversification[1]);
  });
}
