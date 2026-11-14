import { pathReturningTo } from "../accounts/path-returning-to.ts";
import type { ClassId } from "../classes/classes.schema.ts";
import { classPath } from "../classes/class-path.ts";
import type { SessionNumber } from "../classes/course-calendar.ts";

export function learnPath(classId: ClassId): string {
  return `${classPath(classId)}/learn`;
}

export function lessonPath(
  classId: ClassId,
  session: SessionNumber,
  returnTo?: string,
): string {
  const path = `${learnPath(classId)}/${String(session)}`;
  return returnTo === undefined ? path : pathReturningTo(path, returnTo);
}

export function glossaryPath(classId: ClassId, query = ""): string {
  const path = `${classPath(classId)}/glossary`;
  return query === ""
    ? path
    : `${path}?${new URLSearchParams({ q: query }).toString()}`;
}
