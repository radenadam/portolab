import { successValueForTest } from "../../success-value-for-test.ts";
import type { CompanyLogoData } from "../market-data/stock-name.tsx";
import type { ConceptLessonData } from "./concept-lesson.tsx";
import { readConceptLessons } from "./read-concept-lessons.server.ts";

/** The data of the root loader that a part of a page reads in a test. It holds no logos, so every tile shows its monogram. */
export function conceptLessonDataForTest(): ConceptLessonData &
  CompanyLogoData {
  return {
    ...successValueForTest(
      readConceptLessons(),
      "Read concept lessons from the glossary",
    ),
    companyLogos: [],
  };
}
