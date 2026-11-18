import type { SessionNumber } from "../classes/course-calendar.ts";

export const lessonPracticeSessions = [
  2, 6, 9, 10,
] as const satisfies readonly SessionNumber[];
export type LessonPracticeSession = (typeof lessonPracticeSessions)[number];

const lessonActivities = {
  2: "diversification",
  6: "trading",
  9: "capm",
  10: "allocation",
} as const satisfies Record<LessonPracticeSession, string>;

/** The interactive and the practice of a lesson that works with data. */
export type LessonActivity = (typeof lessonActivities)[LessonPracticeSession];
/** The activities that read the measures of a portfolio, which every activity but trading does. */
export type MeasuredLessonActivity = Exclude<LessonActivity, "trading">;

export function hasLessonPractice(
  session: SessionNumber,
): session is LessonPracticeSession {
  return lessonPracticeSessions.some((candidate) => candidate === session);
}

export function lessonActivityOf(
  session: SessionNumber,
): LessonActivity | undefined {
  return hasLessonPractice(session) ? lessonActivities[session] : undefined;
}
