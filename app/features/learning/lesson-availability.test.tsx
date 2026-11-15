import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { cashValuationForTest } from "~/features/measures/measures-for-test.server";
import {
  portfolioAgainstMarketForTest,
  portfolioWithoutVariationForTest,
} from "~/features/measures/portfolio-against-market-for-test";
import { reweightPortfolio } from "~/features/measures/reweight-portfolio";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales, type Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { portfolioWeight } from "~/units/portfolio-weight";
import { monthlyReturn } from "~/units/monthly-return";
import { defaultLessonBeta } from "./lesson-beta-range";
import { LessonOwnNumbers } from "./lesson-own-numbers";
import { LessonPractice } from "./lesson-practice";
import { lessonPracticeForTest } from "./lesson-practice-for-test";
import { LessonRiskPractice } from "./lesson-risk-practice";
import { localizedLearningContent } from "./localized-learning-content.server";
import { practicePortfolio } from "./practice-portfolio";

const texts: Record<
  Locale,
  {
    zero: string;
    negative: string;
    pending: string;
    zeroTask: string;
    changedTask: string;
    done: string;
  }
> = {
  id: {
    zero: "Imbal hasil harapan 25,00%, risiko 0,00%, Sharpe Tidak ada, dan Treynor Tidak ada per bulan. Penggeser dimulai dari bobot portofolio Anda sekarang.",
    negative:
      "Imbal hasil harapan 0,08%, risiko 2,38%, Sharpe -0,17, dan Treynor Tidak ada per bulan. Penggeser dimulai dari bobot portofolio Anda sekarang.",
    pending: "Belum tercapai.",
    zeroTask:
      "Dengan penggeser di atas, buat risiko portofolio lebih besar dari nol. Sekarang 0,00%. Perhatikan bagaimana perubahan bobot memutus keseimbangan antar saham.",
    changedTask:
      "Dengan penggeser di atas, buat risiko portofolio lebih besar dari nol. Sekarang 7,56%. Perhatikan bagaimana perubahan bobot memutus keseimbangan antar saham.",
    done: "Tercapai. Perhatikan juga apa yang terjadi pada imbal hasil harapan.",
  },
  en: {
    zero: "Expected return is 25.00%, risk 0.00%, Sharpe None, and Treynor None per month. The sliders start at your current portfolio weights.",
    negative:
      "Expected return is 0.08%, risk 2.38%, Sharpe -0.17, and Treynor None per month. The sliders start at your current portfolio weights.",
    pending: "Not achieved yet.",
    zeroTask:
      "Use the sliders above to make portfolio risk greater than zero. It is now 0.00%. Observe how changing a weight breaks the offset between the stocks.",
    changedTask:
      "Use the sliders above to make portfolio risk greater than zero. It is now 7.56%. Observe how changing a weight breaks the offset between the stocks.",
    done: "Achieved. Observe what also happens to expected return.",
  },
};

for (const locale of locales) {
  test(`explains offsetting monthly returns and a negative-beta holding without inventing ratios in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const lesson = successValueForTest(
      localizedLearningContent(),
      "Read content",
    ).sessions.find((entry) => entry.session === 10);
    if (lesson === undefined) throw new Error("The course has session 10.");
    // Python Decimal computed the negative-beta portfolio from its fixture's inverse IHSG closes: return 0.0828395%, risk 2.383294%, beta -0.5248837, and Sharpe -0.1662938. Offsetting returns give 25% every month and zero variance by hand.
    for (const [report, expected] of [
      [portfolioWithoutVariationForTest(), texts[locale].zero],
      [portfolioAgainstMarketForTest(), texts[locale].negative],
    ] as const) {
      const own = practicePortfolio(report);
      if (own === undefined)
        throw new Error("The constructed portfolio has measures.");
      const practice = {
        ...lessonPracticeForTest(),
        report,
        simulation: own,
        holdings: own.holdings,
        market: own.market,
        initialBeta: defaultLessonBeta(own),
      };
      const markup = renderMarkupForTest(
        <LessonOwnNumbers
          classId={7 as ClassId}
          lesson={lesson}
          practice={practice}
        />,
      );
      expect(markup.replaceAll(/<[^>]+>/gu, "")).toContain(
        markupTextForTest(expected),
      );
      expect(own.treynorRatio.ok).toBe(false);
      if (own.beta < 0) expect(practice.initialBeta).toBe(-0.5);
    }
    const own = practicePortfolio(lessonPracticeForTest().report);
    if (own === undefined)
      throw new Error("The recorded portfolio has measures.");
    // The independent target is about 3.65914%, so this lower value and the target both display as 3.66%.
    expect(0.03659).toBeLessThan(own.standardDeviation * 0.9);
    const near = renderMarkupForTest(
      <LessonRiskPractice portfolio={own} current={monthlyReturn(0.03659)} />,
    );
    expect(near).toContain(texts[locale].pending);
  });

  test(`gives an achievable task when the stocks offset each other in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const own = practicePortfolio(portfolioWithoutVariationForTest());
    if (own === undefined) throw new Error("The portfolio has measures.");
    const changed = reweightPortfolio(
      own,
      new Map([["OFFSET-A", portfolioWeight(0.4)]]),
    );
    // By hand, the stocks have sample variance 0.5625 * 60 / 59 and covariance of its negative. Weights 0.4 and 0.5 give risk sqrt(0.01 * 0.5625 * 60 / 59).
    expect(changed.standardDeviation.value).toBeCloseTo(
      0.07563292261344161,
      14,
    );
    for (const [current, task, status] of [
      [monthlyReturn(0), texts[locale].zeroTask, texts[locale].pending],
      [
        changed.standardDeviation.value,
        texts[locale].changedTask,
        texts[locale].done,
      ],
    ] as const) {
      const markup = renderMarkupForTest(
        <LessonRiskPractice portfolio={own} current={current} />,
      );
      expect(markup.replaceAll(/<[^>]+>/gu, "")).toContain(
        markupTextForTest(task),
      );
      expect(markup).toContain(markupTextForTest(status));
    }
  });

  test(`keeps lesson prose and symbolic formulas available without market history in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const practice = lessonPracticeForTest(
      cashValuationForTest(),
      openDatabaseForTest(),
    );
    expect(practice.market).toBeUndefined();
    expect(practice.marketFailure).toMatchObject({
      kind: "tooFewReturns",
      count: 0,
    });
    const content = successValueForTest(
      localizedLearningContent(),
      "Read content",
    );
    for (const lesson of content.sessions.filter(
      (entry) => entry.session === 9 || entry.session === 10,
    )) {
      const markup = renderMarkupForTest(
        <LessonPractice
          classId={7 as ClassId}
          lesson={lesson}
          practice={practice}
        >
          {null}
        </LessonPractice>,
      );
      const prose = lesson.sections
        .flatMap((section) => (section.id === "body" ? section.blocks : []))
        .find((block) => block.kind === "paragraph");
      if (prose?.kind !== "paragraph") throw new Error("The lesson has prose.");
      expect(markup).toContain(markupTextForTest(prose.text));
      const text = markup.replaceAll(/<[^>]+>/gu, "");
      if (lesson.session === 9) {
        expect(text).toContain("kp = Rf + βp(E(RM) − Rf)");
        expect(text).toContain("Rf = BI-Rate / 12");
      } else {
        expect(text).toContain("Sp = (E(Rp) − Rf) / σp");
        expect(text).toContain("Tp = (E(Rp) − Rf) / βp");
      }
    }
  });
}
