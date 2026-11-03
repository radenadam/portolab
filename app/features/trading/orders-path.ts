import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** The address of the orders of a student in a class. */
export function ordersPath(classId: ClassId): string {
  return `${classPath(classId)}/orders`;
}
