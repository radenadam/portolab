import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** The address of the market of a class, which its lecturer and its students open. */
export function marketPath(classId: ClassId): string {
  return `${classPath(classId)}/market`;
}
