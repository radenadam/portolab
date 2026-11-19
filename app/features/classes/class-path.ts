// The browser tests load this module without the aliases of the app, so its import is a relative path with its extension.
import type { UserId } from "../accounts/accounts.schema.ts";
import type { ClassId } from "./classes.schema.ts";

export const classMapAxes = ["beta", "deviation"] as const;
export type ClassMapAxis = (typeof classMapAxes)[number];
/** The address of the page of a class. */
export function classPath(classId: ClassId): string {
  return `/classes/${String(classId)}`;
}

export function isClassMapPath(path: string, classId: ClassId): boolean {
  return path.split(/[?#]/)[0] === classPath(classId);
}

export function classMapPath(classId: ClassId, axis: ClassMapAxis): string {
  return `${classPath(classId)}?axis=${axis}`;
}

/** The address of the page on which the lecturer of a class sets the date of its first session. */
export function calendarPath(classId: ClassId): string {
  return `${classPath(classId)}/calendar`;
}

/** The id of the heading of the form that creates a class on the list of classes, to which a link leads. */
export const createClassSectionId = "create-class";

/** The address of the form that creates a class, on the list of the classes of a lecturer. */
export const createClassPath = `/classes#${createClassSectionId}`;

export function resetStudentPasswordPath(
  classId: ClassId,
  studentId: UserId,
): string {
  return `${classPath(classId)}/students/${String(studentId)}/password`;
}
