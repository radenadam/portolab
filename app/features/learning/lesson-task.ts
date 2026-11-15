import { pathWithQuery } from "../../path-with-query.ts";
import type { ClassId } from "../classes/classes.schema.ts";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import { lessonPath } from "./learning-paths.ts";
import { lessonPracticeSessions } from "./lesson-practice-sessions.ts";
import type { LessonPracticeSession } from "./lesson-practice-sessions.ts";

export type LessonTask = LessonPracticeSession;
export const lessonTaskField = "lessonTask";

export function parseLessonTask(
  value: unknown,
  source: string,
): Result<LessonTask | undefined, string> {
  if (value === null) return succeed(undefined);
  const maximumLength = Math.max(
    ...lessonPracticeSessions.map((session) => String(session).length),
  );
  const names = lessonPracticeSessions.join(" or ");
  if (typeof value === "string" && value.length > maximumLength)
    return fail(
      `${source} must name the practice of session ${names}, but it has ${String(value.length)} characters.`,
    );
  for (const session of lessonPracticeSessions)
    if (value === String(session)) return succeed(session);
  return fail(
    `${source} must name the practice of session ${names}, but it is ${describeValue(value)}.`,
  );
}

export function lessonTaskReturnPath(
  classId: ClassId,
  task: LessonTask,
): string {
  return `${lessonPath(classId, task)}#practice`;
}

export function withLessonTask(
  path: string,
  task: LessonTask | undefined,
): string {
  if (task === undefined) return path;
  return pathWithQuery(path, { [lessonTaskField]: String(task) });
}
