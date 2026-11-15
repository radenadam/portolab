import type { ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import type { SessionNumber } from "~/features/classes/course-calendar";
import { parseRecordId } from "~/value-parsers";
import { LearningLink } from "./learning-link";
import { lessonPath } from "./learning-paths";

export function LessonLink({
  session,
  id,
  className,
  children,
}: {
  session: SessionNumber;
  id?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}): ReactNode {
  const params = useParams();
  const location = useLocation();
  const classId = parseRecordId<ClassId>(params["classId"], "classId");
  if (!classId.ok) return children;
  return (
    <LearningLink
      id={id}
      className={className}
      to={lessonPath(
        classId.value,
        session,
        `${location.pathname}${location.search}${id === undefined ? location.hash : `#${id}`}`,
      )}
    >
      {children}
    </LearningLink>
  );
}
