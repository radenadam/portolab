import { successValueForTest } from "~/success-value-for-test";
import { readLessonSessions } from "~/features/learning/read-lesson-sessions.server";
import { expect, test } from "vitest";
import { MemoryRouter } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { classOverviewForTest } from "./class-overview-for-test.server";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { languageNames } from "~/language-names";
import { classCalendarOf } from "./course-calendar";
import { classDiscussion } from "./class-discussion";
import { classSummary } from "./class-summary";
import { classFlags } from "./class-flags";
import { ClassTeachingCards } from "./class-teaching-cards";

const texts: Record<Locale, { empty: readonly string[] }> = {
  id: {
    empty: [
      "Perlu perhatian",
      "Tidak ada mahasiswa yang perlu perhatian.",
      "Bahan diskusi",
      "Alasan terbaru",
      "Belum ada alasan tertulis dari order yang terisi di kelas ini.",
    ],
  },
  en: {
    empty: [
      "Needs attention",
      "No student needs attention.",
      "Discussion questions",
      "Latest reasons",
      "No filled order has a written reason in this class yet.",
    ],
  },
};

for (const locale of locales) {
  test(`renders empty teaching cards and preserves names made of digits in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const lessonSessions = successValueForTest(
      readLessonSessions(),
      "The lesson catalog is parsed",
    );
    const { overview, taughtClass } = await classOverviewForTest();
    const empty = {
      ...overview,
      flags: classFlags([], taughtClass.id),
      reasons: [],
    };
    const html = renderTextMarkupForTest(
      <MemoryRouter>
        <ClassTeachingCards
          overview={empty}
          classId={taughtClass.id}
          axis="beta"
        />
      </MemoryRouter>,
    );
    for (const text of texts[locale].empty)
      expect(html).toContain(renderTextMarkupForTest(<>{text}</>));
    const member = overview.students[0];
    if (member === undefined)
      throw new Error("The class fixture has a student.");
    overview.students = [{ ...member, name: "1000000" }];
    overview.discussion = classDiscussion(
      [
        {
          ...member,
          name: "1000000",
          holdingCount: 2,
          cash: taughtClass.startingCash,
          value: taughtClass.startingCash,
          orderHistory: "filled",
        },
      ],
      {
        calendar: classCalendarOf(
          "2026-08-31",
          new Date("2026-11-02T03:00:00Z"),
        ),
        summary: classSummary([], []),
        lessonSessions,
        now: new Date("2026-11-02T03:00:00Z"),
      },
    );
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <ClassTeachingCards
          overview={overview}
          classId={taughtClass.id}
          axis="beta"
        />
      </MemoryRouter>,
    );
    expect(markup).toContain('data-text-value="">1000000</span>');
    expect(markup).not.toContain('data-number="">1000000</span>');
  });
}
