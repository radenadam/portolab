// The browser tests load this module without the aliases of the app, so its import is a relative path with its extension.
import type { ClassId } from "./classes.schema.ts";

/** The address of the page of a class. */
export function classPath(classId: ClassId): string {
  return `/classes/${String(classId)}`;
}

/** The address of the page on which the lecturer of a class sets the date of its first session. */
export function calendarPath(classId: ClassId): string {
  return `${classPath(classId)}/calendar`;
}

/** The id of the heading of the form that creates a class on the list of classes, to which a link leads. */
export const createClassSectionId = "create-class";

/** The address of the form that creates a class, on the list of the classes of a lecturer. */
export const createClassPath = `/classes#${createClassSectionId}`;
