import { redirect } from "react-router";
import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { classPath } from "./class-path";
import { joinClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";

/** Adds a student to a class, which does nothing when the student is in it already, and answers with the page of the class. */
export function joinAndOpenClass(
  database: Database,
  membership: { classId: ClassId; studentId: UserId },
  now: Date,
): Response {
  joinClass(database, membership, now);
  return redirect(classPath(membership.classId));
}
