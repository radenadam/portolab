import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

export function demonstrationPath(classId: ClassId): string {
  return `${classPath(classId)}/demonstration`;
}
