import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

export function watchlistPath(
  classId: ClassId,
  code: string,
  watched: boolean,
): string {
  return `${classPath(classId)}/watchlist/${encodeURIComponent(code)}/${watched ? "add" : "remove"}`;
}
