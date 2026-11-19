import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { AnalysisMeasures, analysisMeasures } from "./analysis-measures";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import { portfolioAgainstMarketForTest } from "./portfolio-against-market-for-test";

// The market has a beta of 1 and lies on its own security market line, so these references hold by definition.
const texts: Record<
  Locale,
  { beta: string; alpha: string; calculation: string }
> = {
  id: {
    beta: "IHSG 1,00",
    alpha: "IHSG 0,00%",
    calculation: "Lihat perhitungan",
  },
  en: {
    beta: "IHSG 1.00",
    alpha: "IHSG 0.00%",
    calculation: "View calculation",
  },
};

for (const locale of locales) {
  test(`opens the calculation of each measure from the button that holds its value, with the IHSG beside it, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const reader = { kind: "owner", classId: 7 as ClassId } as const;
    const measures = analysisMeasures(
      successValueForTest(
        explainPortfolioMeasures(portfolioAgainstMarketForTest(), reader),
        "The fixture portfolio has measures",
      ),
      reader,
    );
    const html = renderMarkupForTest(
      <AnalysisMeasures measures={measures} />,
      conceptLessonDataForTest(),
    );
    const text = texts[locale];
    expect(measures.map(({ key }) => key)).toEqual([
      "expectedReturn",
      "risk",
      "beta",
      "sharpe",
      "treynor",
      "alpha",
    ]);
    for (const { key, reference } of measures) {
      const button = new RegExp(
        `<button type="button" popoverTarget="analysis-${key}"[^>]*><span>.*?<small>([^<]+)</small></span>.*?<span>${text.calculation}</span><svg`,
        "u",
      ).exec(html);
      expect(button?.[1], key).toBe(reference);
      expect(html).toContain(`<div id="analysis-${key}" popover="auto"`);
    }
    expect(measures.find(({ key }) => key === "beta")?.reference).toBe(
      text.beta,
    );
    expect(measures.find(({ key }) => key === "alpha")?.reference).toBe(
      text.alpha,
    );
  });
}
