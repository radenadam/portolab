import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** The address of the measures of the portfolio of a student in a class and of each stock. */
export function measuresPath(classId: ClassId): string {
  return `${classPath(classId)}/measures`;
}

/** The address of the measures of one stock, with every formula and every monthly return, for a student in a class. */
export function stockMeasuresPath(classId: ClassId, code: string): string {
  return `${measuresPath(classId)}/${code}`;
}
