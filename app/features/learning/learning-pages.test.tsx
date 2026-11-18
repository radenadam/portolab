import { lessonPracticeForTest } from "./lesson-practice-for-test";
import { glossaryCountTextsForTest } from "./glossary-counts-for-test.ts";
import { lessonActivityOf } from "./lesson-practice-sessions";
import { tradingLessonForTest } from "./trading-lesson-for-test";
import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ClassId } from "~/features/classes/classes.schema";
import { classCalendarOf } from "~/features/classes/course-calendar";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { ContentBlock } from "./content";
import { isLessonKind, lessonTerms } from "./content";
import { GlossaryView } from "./glossary-view";
import { parseGlossaryQuery, searchGlossary } from "./glossary-search";
import { LearningIndex } from "./learning-index";
import { LessonView } from "./lesson-view";
import { localizedLearningContent } from "./localized-learning-content.server";
import { sessionKindLabel, sessionLabel } from "./session-text";

const texts: Record<
  Locale,
  {
    title: string;
    interactive: string;
    interactiveWeek: string;
    availablePractice: string;
    full: string;
    glossary: string;
    glossaryLink: string;
    session: string;
    kinds: readonly string[];
    currentKinds: readonly string[];
    exams: readonly string[];
    week: string;
    unavailable: string;
    terms: string;
    lessons: string;
    return: string;
    search: string;
    placeholder: string;
    counts: readonly string[];
    empty: string;
  }
> = {
  id: {
    interactive: "Pelajaran interaktif",
    interactiveWeek: "Pelajaran interaktif · minggu ini",
    availablePractice: "Ada praktik dengan portofolio Anda",
    title: "Belajar",
    full: "Buka di Belajar",
    glossary: "Kamus",
    glossaryLink: "Kamus istilah",
    session: "Sesi 9",
    kinds: ["Ringkasan", "Pelajaran", "Pembahasan penelitian", "Ujian"],
    currentKinds: [
      "Ringkasan · minggu ini",
      "Pelajaran · minggu ini",
      "Pembahasan penelitian · minggu ini",
      "Ujian · minggu ini",
    ],
    exams: ["UTS", "UAS"],
    week: " · minggu ini",
    unavailable: "Belum dapat dipraktikkan",
    terms: "Istilah kunci",
    lessons: "Pelajaran lain",
    return: "Kembali ke halaman sebelumnya",
    search: "Cari di Kamus",
    placeholder: "Cari istilah atau artinya",
    counts: [
      glossaryCountTextsForTest.id.none,
      glossaryCountTextsForTest.id.one,
      glossaryCountTextsForTest.id.all,
    ],
    empty: 'Tidak ada istilah yang memuat "xyz". Coba kata yang lebih pendek.',
  },
  en: {
    interactive: "Interactive lesson",
    interactiveWeek: "Interactive lesson · this week",
    availablePractice: "Includes practice with your portfolio",
    title: "Learn",
    full: "Open in Learn",
    glossary: "Glossary",
    glossaryLink: "Glossary",
    session: "Session 9",
    kinds: ["Summary", "Lesson", "Research review", "Exam"],
    currentKinds: [
      "Summary · this week",
      "Lesson · this week",
      "Research review · this week",
      "Exam · this week",
    ],
    exams: ["Midterm", "Final"],
    week: " · this week",
    unavailable: "Cannot be practised yet",
    terms: "Key terms",
    lessons: "Other lessons",
    return: "Back to the previous page",
    search: "Search Glossary",
    placeholder: "Search terms or definitions",
    counts: [
      glossaryCountTextsForTest.en.none,
      glossaryCountTextsForTest.en.one,
      glossaryCountTextsForTest.en.all,
    ],
    empty: 'No terms contain "xyz". Try a shorter word.',
  },
};

const classId = 7 as ClassId;
const now = new Date("2026-11-14T03:00:00Z");

function paragraphMarkup(blocks: readonly ContentBlock[]): string[] {
  return blocks.flatMap((block) =>
    block.kind === "paragraph"
      ? [renderToStaticMarkup(<p>{block.text}</p>)]
      : [],
  );
}

for (const locale of locales) {
  const text = texts[locale];
  test(`renders all session cards and marks only the current course week in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = successValueForTest(
      localizedLearningContent(),
      "Read pages",
    );
    for (const [firstSessionDate, currentSession] of [
      ["2026-11-14", 1],
      ["2026-10-03", 7],
      ["2026-09-26", 8],
      ["2026-09-19", 9],
      ["2026-08-08", 15],
      ["2026-08-01", 16],
      ["2026-11-21", undefined],
      ["2026-01-01", undefined],
      [null, undefined],
    ] as const) {
      const current = currentSession !== undefined;
      const markup = renderMarkupForTest(
        <LearningIndex
          classId={classId}
          sessions={content.sessions}
          calendar={classCalendarOf(firstSessionDate, now)}
        />,
      );
      expect(markup).toContain(`<h1>${text.title}</h1>`);
      expect(markup).toContain(text.glossaryLink);
      expect(markup.includes('aria-current="step"')).toBe(current);
      expect(markup.includes(text.week)).toBe(current);
      expect(markup.match(/aria-current="step"/gu) ?? []).toHaveLength(
        current ? 1 : 0,
      );
      if (currentSession !== undefined) {
        const marked =
          /<(a|article)[^>]*aria-current="step"[^>]*>[\s\S]*?<\/\1>/u.exec(
            markup,
          )?.[0];
        const expected = content.sessions.find(
          (session) => session.session === currentSession,
        );
        if (expected === undefined)
          throw new Error("The current session is in the course.");
        expect(marked).toContain(
          renderToStaticMarkup(<h2>{expected.title}</h2>),
        );
      }
      for (const session of content.sessions) {
        expect(markup).toContain(
          renderToStaticMarkup(<h2>{session.title}</h2>),
        );
        const summary = session.sections.flatMap((section) =>
          section.id === "summary" ? section.blocks : [],
        );
        expectParagraphs(markup, summary);
        const link = `href="/classes/7/learn/${String(session.session)}"`;
        expect(markup.includes(link)).toBe(isLessonKind(session.kind));
      }
      expect(markup).toContain(text.unavailable);
      expect(markup).toContain(text.availablePractice);
      expect(markup).toContain(text.interactive);
      if (currentSession === 9) expect(markup).toContain(text.interactiveWeek);
    }
    expect(content.sessions.map(sessionKindLabelFromContent)).toEqual(
      content.sessions.map((session) => {
        const index = { short: 0, full: 1, review: 2, exam: 3 }[session.kind];
        return text.kinds[index];
      }),
    );
    for (const [index, kind] of (
      ["short", "full", "review", "exam"] as const
    ).entries()) {
      expect(sessionKindLabel(kind, true)).toBe(text.currentKinds[index]);
    }
    expect(
      content.sessions
        .filter((entry) => entry.kind === "exam")
        .map(sessionLabel),
    ).toEqual(text.exams);
    const ninth = content.sessions.find((entry) => entry.session === 9);
    if (ninth === undefined) throw new Error("Missing session 9.");
    expect(sessionLabel(ninth)).toBe(text.session);
  });

  test(`renders every lesson paragraph and term with its implemented practice in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = successValueForTest(
      localizedLearningContent(),
      "Read lessons",
    );
    const lessons = content.sessions.filter((entry) =>
      isLessonKind(entry.kind),
    );
    for (const [index, lesson] of lessons.entries()) {
      const terms = lessonTerms(lesson, content.terms);
      const activity = lessonActivityOf(lesson.session);
      const practice =
        activity === undefined || activity === "trading"
          ? undefined
          : lessonPracticeForTest();
      const trading =
        activity === "trading" ? tradingLessonForTest() : undefined;
      const interactive = practice !== undefined || trading !== undefined;
      const props = {
        classId,
        lesson,
        terms,
        practice,
        trading,
        previous: lessons[index - 1],
        next: lessons[index + 1],
        returnTo: "/classes/7/stocks/BBCA?range=3m",
      };
      const markup = renderMarkupForTest(<LessonView {...props} />);
      const sheet = renderMarkupForTest(
        <LessonView {...props} inSheet idPrefix="sheet-" />,
      );
      expect(sheet).toContain(text.full);
      expect(sheet).not.toContain("<h1");
      expect(sheet).not.toContain(`aria-label="${text.lessons}"`);
      expect(sheet).toContain('id="sheet-key-terms"');
      expect(sheet).toContain(`/learn/${String(lesson.session)}?returnTo=`);
      if (interactive) {
        expect(sheet).toContain('href="#sheet-practice"');
        expect(sheet).toContain('id="sheet-practice"');
        expect(sheet).not.toContain('id="practice"');
        expect(sheet).toContain(
          'aria-labelledby="sheet-lesson-interactive-title"',
        );
        if (lesson.session === 9) {
          expect(sheet).toContain('id="sheet-map-lesson-alpha-TLKM"');
          expect(sheet).toContain('id="sheet-lesson-alpha-TLKM"');
          expect(sheet).toContain('popoverTarget="sheet-lesson-alpha-TLKM"');
        }
      }
      expect(markup).toContain(text.return);
      expect(markup).toContain(text.terms);
      if (!interactive) expect(markup.match(/<h2[ >]/gu)).toHaveLength(1);
      expect(markup).toContain(`aria-label="${text.lessons}"`);
      const blocks = lesson.sections.flatMap((section) =>
        "blocks" in section && section.id !== "summary" ? section.blocks : [],
      );
      for (const rendered of [markup, sheet])
        expectParagraphs(rendered, [
          ...blocks,
          ...terms.flatMap((term) => term.blocks),
        ]);
      expect(markup).not.toContain("{{");
      expect(markup.includes('id="practice"')).toBe(interactive);
      expect(markup).not.toContain("<input");
      expect(markup.match(/<details[^>]*id="term-/gu)).toHaveLength(
        terms.length,
      );
    }
  });

  test(`renders the glossary, search results, and their exact lesson destinations in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = successValueForTest(
      localizedLearningContent(),
      "Read glossary",
    );
    for (const [query, countIndex] of [
      ["xyz", 0],
      ["ARA (", 1],
      ["", 2],
    ] as const) {
      const terms = searchGlossary(content.terms, query);
      const markup = renderMarkupForTest(
        <GlossaryView
          classId={classId}
          query={query}
          terms={terms}
          sessions={content.sessions}
          error={undefined}
        />,
      );
      expect(markup).toContain(`<h1>${text.glossary}</h1>`);
      expect(markup).toContain(text.search);
      expect(markup).toContain(text.placeholder);
      if (query === "xyz") {
        expect(markup).toContain(
          renderToStaticMarkup(<p role="status">{text.empty}</p>),
        );
        expect(markup).not.toContain(text.counts[0]);
      } else expect(markup).toContain(text.counts[countIndex]);
      for (const term of terms) {
        for (const paragraph of paragraphMarkup(term.blocks))
          expect(markup).toContain(paragraph);
        expect(markup).toContain(
          `/classes/7/learn/${String(term.session)}?returnTo=`,
        );
      }
    }
    expect(parseGlossaryQuery(null, text.search)).toEqual({
      ok: true,
      value: "",
    });
    expect(parseGlossaryQuery("  BeTa  ", text.search)).toEqual({
      ok: true,
      value: "BeTa",
    });
    expect(searchGlossary(content.terms, "BETA")).toEqual(
      searchGlossary(content.terms, "beta"),
    );
    const definition = "linear";
    expect(
      searchGlossary(content.terms, definition).some(
        (term) => term.id === "korelasi",
      ),
    ).toBe(true);
  });
}

function sessionKindLabelFromContent(session: {
  kind: Parameters<typeof sessionKindLabel>[0];
}): string {
  return sessionKindLabel(session.kind);
}

function expectParagraphs(
  markup: string,
  blocks: readonly ContentBlock[],
): void {
  for (const paragraph of paragraphMarkup(blocks))
    expect(markup).toContain(paragraph);
}
