import { pathWithQuery } from "../../path-with-query.ts";
import type { ClassId } from "../classes/classes.schema.ts";
import { classPath } from "../classes/class-path.ts";
import type { SessionNumber } from "../classes/course-calendar.ts";

export function learnPath(classId: ClassId): string {
  return `${classPath(classId)}/learn`;
}

export function priceGuidePath(classId: ClassId, returnTo?: string): string {
  const path = `${learnPath(classId)}/prices`;
  return returnTo === undefined ? path : pathWithQuery(path, { returnTo });
}

export function lessonPath(
  classId: ClassId,
  session: SessionNumber,
  returnTo?: string,
): string {
  const path = `${learnPath(classId)}/${String(session)}`;
  return returnTo === undefined ? path : pathWithQuery(path, { returnTo });
}

export function glossaryPath(
  classId: ClassId,
  query = "",
  returnTo?: string,
): string {
  const path = `${classPath(classId)}/glossary`;
  const destination =
    query === ""
      ? path
      : `${path}?${new URLSearchParams({ q: query }).toString()}`;
  return returnTo === undefined
    ? destination
    : pathWithQuery(destination, { returnTo });
}
