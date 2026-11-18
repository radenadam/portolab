import { pathWithQuery } from "../../path-with-query.ts";
import type { ClassId } from "../classes/classes.schema.ts";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import { describeValue } from "../../value-shapes.ts";
import { lessonPath, priceGuidePath } from "./learning-paths.ts";
import { lessonPracticeSessions } from "./lesson-practice-sessions.ts";
import type { LessonPracticeSession } from "./lesson-practice-sessions.ts";

export type LessonTask = LessonPracticeSession | "prices";
export const lessonTaskField = "lessonTask";
const lessonTasks = [...lessonPracticeSessions, "prices"] as const;

export function parseLessonTask(
  value: unknown,
  source: string,
): Result<LessonTask | undefined, string> {
  if (value === null) return succeed(undefined);
  const maximumLength = Math.max(
    ...lessonTasks.map((session) => String(session).length),
  );
  const names = lessonTasks.join(" or ");
  if (typeof value === "string" && value.length > maximumLength)
    return fail(
      `${source} must name a learning task from ${names}, but it has ${String(value.length)} characters.`,
    );
  for (const session of lessonTasks)
    if (value === String(session)) return succeed(session);
  return fail(
    `${source} must name a learning task from ${names}, but it is ${describeValue(value)}.`,
  );
}

export function lessonTaskReturnPath(
  classId: ClassId,
  task: LessonTask,
): string {
  return `${task === "prices" ? priceGuidePath(classId) : lessonPath(classId, task)}#practice`;
}

export function withLessonTask(
  path: string,
  task: LessonTask | undefined,
): string {
  if (task === undefined) return path;
  return pathWithQuery(path, { [lessonTaskField]: String(task) });
}
