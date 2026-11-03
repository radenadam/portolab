import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** The address of the portfolio of a student in a class. */
export function portfolioPath(classId: ClassId): string {
  return `${classPath(classId)}/portfolio`;
}
