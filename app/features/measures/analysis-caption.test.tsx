import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { languageNames } from "~/language-names";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { monthlyReturn } from "~/units/monthly-return";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import {
  analysisAlphaInsight,
  analysisDiversificationInsight,
} from "./analysis-insight";
import { AnalysisCaption } from "./analysis-caption";
const texts: Record<
  Locale,
  { name: string; html: string; risk: readonly [string, string] }
> = {
  id: {
    name: "0,03",
    risk: [
      "<span>Diversifikasi menurunkan risiko dari <strong>5,00%</strong> ke <strong>4,00%</strong> dengan imbal hasil harapan yang sama.</span>",
      "<span>Risiko portofolio <strong>5,00%</strong> sama dengan rata-rata tertimbang risiko saham <strong>5,00%</strong>.</span>",
    ],
    html: "<span>Portofolio 0,03 di atas garis sejauh <strong>0,03</strong> poin per bulan. Pilih titik untuk melihat perhitungan alphanya.</span>",
  },
  en: {
    name: "0.03",
    risk: [
      "<span>Diversification lowers risk from <strong>5.00%</strong> to <strong>4.00%</strong> at the same expected return.</span>",
      "<span>Portfolio risk of <strong>5.00%</strong> equals the weighted average stock risk of <strong>5.00%</strong>.</span>",
    ],
    html: "<span>The portfolio of 0.03 is <strong>0.03</strong> points per month above the line. Select a point to see its alpha calculation.</span>",
  },
};
for (const locale of locales)
  test(`keeps a student's numeric name separate from the same measure value in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const { name, html } = texts[locale];
    expect(
      renderTextMarkupForTest(
        <AnalysisCaption
          insight={(studentName) =>
            analysisAlphaInsight(monthlyReturn(0.0003), studentName)
          }
          studentName={name}
        />,
      ),
    ).toBe(html);
  });

for (const locale of locales)
  test(`highlights each risk value, including repeated values, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [index, risk] of [0.04, 0.05].entries())
      expect(
        renderTextMarkupForTest(
          <AnalysisCaption
            insight={() =>
              analysisDiversificationInsight(
                monthlyReturn(0.05),
                monthlyReturn(risk),
              )
            }
          />,
        ),
      ).toBe(texts[locale].risk[index]);
  });
