import type { ClassId } from "./classes.schema";

/** The address of the page of a class. */
export function classPath(classId: ClassId): string {
  return `/classes/${String(classId)}`;
}
