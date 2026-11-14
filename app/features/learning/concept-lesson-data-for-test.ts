import { successValueForTest } from "../../success-value-for-test.ts";
import type { ConceptLessonData } from "./concept-lesson.tsx";
import { readConceptLessons } from "./read-concept-lessons.server.ts";

export function conceptLessonDataForTest(): ConceptLessonData {
  return successValueForTest(
    readConceptLessons(),
    "Read concept lessons from the glossary",
  );
}
