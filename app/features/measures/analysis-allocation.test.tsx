import { AnalysisAllocation } from "./analysis-allocation";
import { valuationForTest } from "./measures-for-test.server";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { textOfMarkupForTest } from "~/text-of-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { expect, test } from "vitest";

const weightFormulaTexts: Record<Locale, string> = {
  id: "Nilai setiap saham atau kas dibagi nilai total portofolio.",
  en: "The value of each stock or of the cash divided by the total value of the portfolio.",
};

for (const locale of locales) {
  test(`says what the formula of a weight computes before the formula in the card of the allocation, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = renderMarkupForTest(
      <AnalysisAllocation
        valuation={valuationForTest(["BBCA", "TLKM"])}
        reader={{ kind: "owner", classId: 7 as ClassId }}
      />,
      conceptLessonDataForTest(),
    );
    const sentence = `<p>${weightFormulaTexts[locale]}</p>`;
    expect(html).toContain(sentence);
    // The sentence stands right before the formula that it explains.
    const formula = html.slice(html.indexOf(sentence) + sentence.length);
    expect(
      textOfMarkupForTest(formula.slice(0, formula.indexOf("</p>"))),
    ).toMatch(/^w/u);
  });
}
