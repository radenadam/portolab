import { getLocale } from "../../paraglide/runtime.js";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import type { ConceptLessonData } from "./concept-lesson.tsx";
import { conceptTermIds } from "./concept-term-ids.ts";
import { readLearningContent } from "./read-learning-content.server.ts";

export function readConceptLessons(): Result<ConceptLessonData, string> {
  const content = readLearningContent();
  if (!content.ok) return content;
  const translation = content.value.find(
    (entry) => entry.locale === getLocale(),
  );
  if (translation === undefined) {
    throw new Error("The parsed learning content has no active language.");
  }
  const conceptLessons: ConceptLessonData["conceptLessons"] = [];
  const problems: string[] = [];
  for (const termId of conceptTermIds) {
    const term = translation.terms.find((entry) => entry.id === termId);
    if (term === undefined) {
      problems.push(
        `Learning content ${translation.locale} glossary must have term ${describeValue(termId)} for its concept card, but it is missing.`,
      );
    } else {
      conceptLessons.push({ termId, session: term.session });
    }
  }
  return problems.length > 0
    ? fail(problems.join("\n"))
    : succeed({ conceptLessons });
}
