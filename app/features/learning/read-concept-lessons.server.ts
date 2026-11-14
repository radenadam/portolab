import { getLocale } from "../../paraglide/runtime.js";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import type { ConceptLessonData } from "./concept-lesson.tsx";
import { conceptTermIds } from "./concept-term-ids.ts";
import { localizedLearningContent } from "./localized-learning-content.server.ts";

export function readConceptLessons(): Result<ConceptLessonData, string> {
  const content = localizedLearningContent();
  if (!content.ok) return content;
  const translation = content.value;
  const conceptLessons: ConceptLessonData["conceptLessons"] = [];
  const problems: string[] = [];
  for (const termId of conceptTermIds) {
    const term = translation.terms.find((entry) => entry.id === termId);
    if (term === undefined) {
      problems.push(
        `Learning content ${getLocale()} glossary must have term ${describeValue(termId)} for its concept card, but it is missing.`,
      );
    } else {
      conceptLessons.push({ termId, session: term.session });
    }
  }
  return problems.length > 0
    ? fail(problems.join("\n"))
    : succeed({ conceptLessons });
}
