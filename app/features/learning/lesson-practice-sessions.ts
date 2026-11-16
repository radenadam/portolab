import type { SessionNumber } from "../classes/course-calendar.ts";

export const lessonPracticeSessions = [
  9, 10,
] as const satisfies readonly SessionNumber[];
export type LessonPracticeSession = (typeof lessonPracticeSessions)[number];

export function hasLessonPractice(
  session: SessionNumber,
): session is LessonPracticeSession {
  return lessonPracticeSessions.some((candidate) => candidate === session);
}
