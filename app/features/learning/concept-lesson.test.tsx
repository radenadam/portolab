import { afterEach, expect, test, vi } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { fail } from "~/result";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { ConceptLesson } from "./concept-lesson";
import { readConceptLessons } from "./read-concept-lessons.server";
import * as learningContent from "./read-learning-content.server";

afterEach(() => vi.restoreAllMocks());

const texts: Record<Locale, string> = {
  id: "Pelajari lebih lanjut di sesi 5. Pelajaran belum tersedia di Portolab.",
  en: "Learn more in session 5. The lesson is not available in Portolab yet.",
};

for (const locale of locales) {
  test(`follows a changed glossary session through the server data into the card in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = successValueForTest(
      learningContent.readLearningContent(),
      "Read the glossary",
    );
    const term = content
      .find((entry) => entry.locale === locale)
      ?.terms.find((entry) => entry.id === "beta");
    if (term === undefined) throw new Error("The glossary has no beta term.");
    expect(term.session).not.toBe(5);
    term.session = 5;
    vi.spyOn(learningContent, "readLearningContent").mockReturnValueOnce({
      ok: true,
      value: content,
    });
    const data = successValueForTest(
      readConceptLessons(),
      "Read the changed lesson",
    );
    expect(renderMarkupForTest(<ConceptLesson termId="beta" />, data)).toBe(
      texts[locale],
    );
  });

  test(`reports missing concept terms together from the glossary in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const content = successValueForTest(
      learningContent.readLearningContent(),
      "Read the glossary",
    );
    const translation = content.find((entry) => entry.locale === locale);
    if (translation === undefined)
      throw new Error("The glossary has no active language.");
    expect(translation.terms.some((term) => term.id === "beta")).toBe(true);
    expect(translation.terms.some((term) => term.id === "harga-tertunda")).toBe(
      true,
    );
    translation.terms = translation.terms.filter(
      (term) => term.id !== "beta" && term.id !== "harga-tertunda",
    );
    vi.spyOn(learningContent, "readLearningContent").mockReturnValueOnce({
      ok: true,
      value: content,
    });
    expect(readConceptLessons()).toEqual(
      fail(
        [
          `Learning content ${locale} glossary must have term "beta" for its concept card, but it is missing.`,
          `Learning content ${locale} glossary must have term "harga-tertunda" for its concept card, but it is missing.`,
        ].join("\n"),
      ),
    );
  });
}

test("passes on the source and reason when the learning content is invalid", () => {
  const failure = "Course files en must have a glossary, but it has none.";
  vi.spyOn(learningContent, "readLearningContent").mockReturnValueOnce(
    fail(failure),
  );
  expect(readConceptLessons()).toEqual(fail(failure));
});
