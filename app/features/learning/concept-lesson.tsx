import type { ReactNode } from "react";
import { Link, useLocation, useParams, useRouteLoaderData } from "react-router";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { ClassId } from "~/features/classes/classes.schema";
import { parseRecordId } from "~/value-parsers";
import { lessonPath } from "./learning-paths";
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
  const params = useParams();
  const location = useLocation();
  const classId = parseRecordId<ClassId>(params["classId"], "classId");
  const label = m.learning_concept_lesson_link({
    session: formatNumber(session),
  });
  if (!classId.ok) return label;
  return (
    <Link
      to={lessonPath(
        classId.value,
        session,
        `${location.pathname}${location.search}${location.hash}`,
      )}
    >
      {label}
    </Link>
  );
}
