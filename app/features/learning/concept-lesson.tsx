import type { ReactNode } from "react";
import { useRouteLoaderData } from "react-router";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { SessionNumber } from "../classes/course-calendar";
import type { ConceptTermId } from "./concept-term-ids";

export interface ConceptLessonData {
  conceptLessons: { termId: ConceptTermId; session: SessionNumber }[];
}

/** The glossary owns each term's lesson, so the server supplies only that metadata to the cards. */
export function ConceptLesson({
  termId,
}: {
  termId: ConceptTermId;
}): ReactNode {
  const data = useRouteLoaderData<ConceptLessonData>("root");
  const session = data?.conceptLessons.find(
    (lesson) => lesson.termId === termId,
  )?.session;
  if (session === undefined) {
    throw new Error(
      `The concept card's glossary term "${termId}" has no lesson.`,
    );
  }
  return m.app_concept_lesson_notice({ session: formatNumber(session) });
}
