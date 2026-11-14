import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** The stock in the workspace of a class, as decision 0030 sets. */
export function stockPath(classId: ClassId, code: string): string {
  return `${classPath(classId)}/stocks/${code}`;
}
