import { succeed } from "../../result.ts";
import { isLessonKind } from "./content.ts";
import { localizedLearningContent } from "./localized-learning-content.server.ts";

export function readLessonSessions() {
  const content = localizedLearningContent();
  if (!content.ok) return content;
  return succeed(
    content.value.sessions
      .filter((lesson) => isLessonKind(lesson.kind))
      .map((lesson) => lesson.session),
  );
}
