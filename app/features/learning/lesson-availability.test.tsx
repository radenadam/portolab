import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { ClassId } from "~/features/classes/classes.schema";
import {
  cashValuationForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import { rupiah } from "~/units/rupiah";
import {
  portfolioAgainstMarketForTest,
  portfolioWithoutVariationForTest,
} from "~/features/measures/portfolio-against-market-for-test";
import { reweightPortfolio } from "~/features/measures/reweight-portfolio";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales, type Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { textOfMarkupForTest } from "~/text-of-markup-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { portfolioWeight } from "~/units/portfolio-weight";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { defaultLessonBeta } from "./lesson-beta-range";
import { LessonOwnNumbers } from "./lesson-own-numbers";
import { LessonAllocation } from "./lesson-allocation";
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
    nearTask: string;
    tinyChangedTask: string;
    done: string;
    missingComparison: string;
    negativePair: string;
    openPractice: string;
  }
> = {
  id: {
    openPractice: "Kerjakan di halaman pelajaran",
    missingComparison: "sekarang Tidak ada",
    negativePair: "50,00% × 50,00% × (-0,572) = -0,143",
    zero: "Imbal hasil harapan 25,00%, risiko 0,00%, Sharpe Tidak ada, dan Treynor Tidak ada per bulan. Penggeser dimulai dari bobot portofolio Anda sekarang.",
    negative:
      "Imbal hasil harapan 0,08%, risiko 2,38%, Sharpe -0,17, dan Treynor Tidak ada per bulan. Penggeser dimulai dari bobot portofolio Anda sekarang.",
    pending: "Belum tercapai.",
    nearTask:
      "Dengan penggeser di atas, naikkan risiko portofolio hingga di atas 0,01%. Sekarang 0,01%.",
    tinyChangedTask:
      "Dengan penggeser di atas, naikkan risiko portofolio hingga di atas 0,01%. Sekarang 0,02%.",
    zeroTask:
      "Dengan penggeser di atas, naikkan risiko portofolio hingga di atas 0,01%. Sekarang 0,00%.",
    changedTask:
      "Dengan penggeser di atas, naikkan risiko portofolio hingga di atas 0,01%. Sekarang 7,56%.",
    done: "Tercapai. Perhatikan juga apa yang terjadi pada imbal hasil harapan.",
  },
  en: {
    openPractice: "Work on the lesson page",
    missingComparison: "current None",
    negativePair: "50.00% × 50.00% × (-0.572) = -0.143",
    zero: "Expected return is 25.00%, risk 0.00%, Sharpe None, and Treynor None per month. The sliders start at your current portfolio weights.",
    negative:
      "Expected return is 0.08%, risk 2.38%, Sharpe -0.17, and Treynor None per month. The sliders start at your current portfolio weights.",
    pending: "Not achieved yet.",
    nearTask:
      "Use the sliders above to raise portfolio risk above 0.01%. It is now 0.01%.",
    tinyChangedTask:
      "Use the sliders above to raise portfolio risk above 0.01%. It is now 0.02%.",
    zeroTask:
      "Use the sliders above to raise portfolio risk above 0.01%. It is now 0.00%.",
    changedTask:
      "Use the sliders above to raise portfolio risk above 0.01%. It is now 7.56%.",
    done: "Achieved. Observe what also happens to expected return.",
  },
};

function expectRiskTask(
  portfolio: PortfolioSummary,
  current: MonthlyReturn,
  expected: { task: string; status: string },
): void {
  const markup = renderMarkupForTest(
    <LessonRiskPractice portfolio={portfolio} current={current} />,
  );
  expect(textOfMarkupForTest(markup)).toContain(
    markupTextForTest(expected.task),
  );
  expect(markup).toContain(markupTextForTest(expected.status));
}

for (const locale of locales) {
  test(`explains offsetting monthly returns and a negative-beta holding without inventing ratios in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // Python Decimal computed the negative-beta portfolio from its fixture's inverse IHSG closes: return 0.0828395%, risk 2.383294%, beta -0.5248837, and Sharpe -0.1662938. Offsetting returns give 25% every month and zero variance by hand.
    for (const [report, expected, missingCount] of [
      [portfolioWithoutVariationForTest(), texts[locale].zero, 2],
      [portfolioAgainstMarketForTest(), texts[locale].negative, 1],
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
          activity="allocation"
          practice={practice}
        />,
      );
      expect(textOfMarkupForTest(markup)).toContain(
        markupTextForTest(expected),
      );
      expect(own.treynorRatio.ok).toBe(false);
      const allocation = textOfMarkupForTest(
        renderMarkupForTest(
          <LessonAllocation portfolio={own} own={own} explanation={null}>
            {null}
          </LessonAllocation>,
        ),
      );
      expect(
        allocation.split(markupTextForTest(texts[locale].missingComparison))
          .length - 1,
      ).toBe(missingCount);
      if (!own.sharpeRatio.ok)
        expect(allocation).toContain(
          markupTextForTest(texts[locale].negativePair),
        );
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
      expectRiskTask(own, current, { task, status });
    }
  });

  test(`gives a visible goal when the proportional target rounds to zero in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const own = practicePortfolio(
      lessonPracticeForTest(
        valuationForTest(["BBCA", "TLKM"], rupiah(1_000_000_000_000)),
      ).report,
    );
    if (own === undefined) throw new Error("The portfolio has measures.");
    // Python Decimal uses values Rp27,390,000 and Rp16,434,000, cash Rp1,000,000,000,000, and the recorded covariances to give risk 0.0002227101121806723%.
    expect(own.standardDeviation).toBeCloseTo(0.000002227101121806723, 18);
    expect(own.holdingRisks.ok).toBe(true);
    for (const [current, task, status] of [
      [own.standardDeviation, texts[locale].zeroTask, texts[locale].pending],
      [
        monthlyReturn(0.00010001),
        texts[locale].nearTask,
        texts[locale].pending,
      ],
      [
        monthlyReturn(0.000151),
        texts[locale].tinyChangedTask,
        texts[locale].done,
      ],
    ] as const) {
      expectRiskTask(own, current, { task, status });
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
      const text = textOfMarkupForTest(markup);
      const taskPage = `/classes/7/learn/${String(lesson.session)}#practice`;
      const sheet = renderMarkupForTest(
        <LessonPractice
          classId={7 as ClassId}
          lesson={lesson}
          practice={practice}
          taskPage={taskPage}
        >
          {null}
        </LessonPractice>,
      );
      expect(sheet).toContain(texts[locale].openPractice);
      expect(sheet).toContain(`href="${taskPage}"`);
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
