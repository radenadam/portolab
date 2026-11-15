import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

export function measuresPath(classId: ClassId): string {
  return `${classPath(classId)}/analysis`;
}
