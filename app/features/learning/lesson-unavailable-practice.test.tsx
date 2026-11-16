import { textOfMarkupForTest } from "~/text-of-markup-for-test";
import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { measureFailureText } from "~/features/measures/measure-failure-text";
import { MethodNotice } from "~/features/measures/method-notice";
import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";
import {
  aadiValuationForTest,
  cashValuationForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales, type Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { LessonPracticeData } from "./lesson-practice-data";
import { lessonPracticeForTest } from "./lesson-practice-for-test";
import { LessonPractice } from "./lesson-practice";
import { localizedLearningContent } from "./localized-learning-content.server";
import { hasLessonPractice } from "./lesson-practice-sessions";

const texts: Record<
  Locale,
  { student: string; unavailable: string; example: string }
> = {
  id: {
    student: "Praktik ini memakai portofolio mahasiswa.",
    unavailable:
      "Latihan ini perlu data imbal hasil bulanan yang bisa dipakai. Buka penjelasan pelajaran untuk membaca kebutuhan datanya.",
    example:
      "Contoh dari imbal hasil bulanan saham yang tersimpan. Bobot contoh tidak mengubah portofolio Anda.",
  },
  en: {
    student: "This practice uses a student portfolio.",
    unavailable:
      "This exercise needs usable monthly return data. Open the lesson explanation for the data requirements.",
    example:
      "An example from stored monthly stock returns. Example weights do not change your portfolio.",
  },
};

function expectOnce(markup: string, expected: string): void {
  const paragraphs = [...markup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gu)].map(
    (match) => textOfMarkupForTest(match[1] ?? ""),
  );
  expect(paragraphs.filter((paragraph) => paragraph === expected)).toHaveLength(
    1,
  );
  expect(textOfMarkupForTest(markup).split(expected).length - 1).toBe(1);
}

function practiceLessonsForTest() {
  return successValueForTest(
    localizedLearningContent(),
    "Read lessons",
  ).sessions.filter((lesson) => hasLessonPractice(lesson.session));
}

for (const locale of locales) {
  test(`explains each unavailable student portfolio once in the complete lesson in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const example = lessonPracticeForTest().simulation;
    if (example === undefined)
      throw new Error("The fixture has an allocation.");
    const practices = [
      lessonPracticeForTest(cashValuationForTest()),
      lessonPracticeForTest(valuationForTest(["BBCA"])),
      lessonPracticeForTest(aadiValuationForTest()),
      lessonPracticeForTest(
        valuationForTest(["BBCA", "TLKM"]),
        openDatabaseForTest(),
      ),
    ];
    const lessons = practiceLessonsForTest();
    const settings = textOfMarkupForTest(renderMarkupForTest(<MethodNotice />));
    for (const practice of practices) {
      const report = practice.report;
      if (report === undefined) throw new Error("The student has a report.");
      const notice = textOfMarkupForTest(
        renderMarkupForTest(
          <PortfolioMeasuresNotice
            report={report}
            reader={{ kind: "owner", classId: 7 as ClassId }}
          />,
        ),
      );
      expect(notice).not.toBe("");
      for (const simulation of [undefined, example]) {
        for (const lesson of lessons) {
          const markup = renderMarkupForTest(
            <LessonPractice
              classId={7 as ClassId}
              lesson={lesson}
              practice={{ ...practice, simulation }}
            >
              {null}
            </LessonPractice>,
          );
          expectOnce(markup, notice);
          expectOnce(markup, settings);
          const practiceStart = markup.indexOf('id="practice"');
          expect(practiceStart).toBeGreaterThanOrEqual(0);
          expectOnce(markup.slice(practiceStart), notice);
        }
      }
    }
  });

  test(`keeps the lecturer notice true with and without an example in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const recorded = lessonPracticeForTest();
    const empty = lessonPracticeForTest(
      cashValuationForTest(),
      openDatabaseForTest(),
    );
    const practices: LessonPracticeData[] = [
      { ...recorded, report: undefined, holdings: [] },
      { ...recorded, report: undefined, holdings: [], simulation: undefined },
      { ...empty, report: undefined, holdings: [] },
    ];
    const lessons = practiceLessonsForTest();
    const settings = textOfMarkupForTest(renderMarkupForTest(<MethodNotice />));
    for (const practice of practices) {
      for (const lesson of lessons) {
        const markup = renderMarkupForTest(
          <LessonPractice
            classId={7 as ClassId}
            lesson={lesson}
            practice={practice}
          >
            {null}
          </LessonPractice>,
        );
        expectOnce(markup, markupTextForTest(texts[locale].student));
        expectOnce(markup, settings);
        if (
          practice.market === undefined ||
          (lesson.session === 10 && practice.simulation === undefined)
        )
          expectOnce(markup, markupTextForTest(texts[locale].unavailable));
        if (lesson.session === 10 && practice.simulation !== undefined)
          expectOnce(markup, markupTextForTest(texts[locale].example));
        else
          expect(textOfMarkupForTest(markup)).not.toContain(
            markupTextForTest(texts[locale].example),
          );
        if (practice.marketFailure !== undefined)
          expectOnce(
            markup,
            markupTextForTest(
              measureFailureText(practice.marketFailure, { kind: "market" }),
            ),
          );
      }
    }
  });
}
