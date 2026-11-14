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
    glossary: string;
    glossaryLink: string;
    session: string;
    kinds: readonly string[];
    exams: readonly string[];
    week: string;
    unavailable: string;
    terms: string;
    idea: string;
    lessons: string;
    return: string;
    search: string;
    placeholder: string;
    counts: readonly string[];
    empty: string;
  }
> = {
  id: {
    title: "Belajar",
    glossary: "Kamus",
    glossaryLink: "Kamus istilah",
    session: "Sesi 9",
    kinds: ["Ringkasan", "Pelajaran", "Pembahasan penelitian", "Ujian"],
    exams: ["UTS", "UAS"],
    week: " · minggu ini",
    unavailable: "Belum dapat dipraktikkan",
    terms: "Istilah kunci",
    idea: "Ide kunci",
    lessons: "Pelajaran lain",
    return: "Kembali ke halaman sebelumnya",
    search: "Cari di Kamus",
    placeholder: "Cari istilah atau artinya",
    counts: ["0 istilah", "1 istilah", "44 istilah"],
    empty: 'Tidak ada istilah yang memuat "xyz". Coba kata yang lebih pendek.',
  },
  en: {
    title: "Learn",
    glossary: "Glossary",
    glossaryLink: "Glossary",
    session: "Session 9",
    kinds: ["Summary", "Lesson", "Research review", "Exam"],
    exams: ["Midterm", "Final"],
    week: " · this week",
    unavailable: "Cannot be practised yet",
    terms: "Key terms",
    idea: "Key idea",
    lessons: "Other lessons",
    return: "Back to the previous page",
    search: "Search Glossary",
    placeholder: "Search terms or definitions",
    counts: ["0 terms", "1 term", "44 terms"],
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
    }
    expect(content.sessions.map(sessionKindLabelFromContent)).toEqual(
      content.sessions.map((session) => {
        const index = { short: 0, full: 1, review: 2, exam: 3 }[session.kind];
        return text.kinds[index];
      }),
    );
    expect(
      content.sessions
        .filter((entry) => entry.kind === "exam")
        .map(sessionLabel),
    ).toEqual(text.exams);
    const ninth = content.sessions.find((entry) => entry.session === 9);
    if (ninth === undefined) throw new Error("Missing session 9.");
    expect(sessionLabel(ninth)).toBe(text.session);
  });

  test(`renders every lesson paragraph and term without future activities in ${languageNames[locale]}`, () => {
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
      const markup = renderMarkupForTest(
        <LessonView
          classId={classId}
          lesson={lesson}
          terms={terms}
          previous={lessons[index - 1]}
          next={lessons[index + 1]}
          returnTo="/classes/7/stocks/BBCA?range=3m"
        />,
      );
      expect(markup).toContain(text.return);
      expect(markup).toContain(text.terms);
      expect(markup).toContain(text.idea);
      expect(markup).toContain(`aria-label="${text.lessons}"`);
      const blocks = lesson.sections.flatMap((section) =>
        "blocks" in section && section.id !== "summary" ? section.blocks : [],
      );
      expectParagraphs(markup, [
        ...blocks,
        ...terms.flatMap((term) => term.blocks),
      ]);
      expect(markup).not.toContain("{{");
      expect(markup).not.toContain('id="practice"');
      expect(markup).not.toContain("<input");
      expect(markup.match(/<details /gu)).toHaveLength(terms.length);
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
