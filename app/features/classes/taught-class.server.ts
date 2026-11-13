import { data } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import { requireRole } from "~/features/accounts/current-session.server";
import type { Rupiah } from "~/units/rupiah";
import { parseRecordId } from "~/value-parsers";
import { findClassStudent, findTaughtClass } from "./class-store.server";
import type { ClassStudent } from "./class-store.server";
import type { ClassId } from "./classes.schema";

/** A class that the lecturer who is signed in teaches, with the cash that each of its students starts with and the calendar date when its first session meets, which a class that Portolab created before it stored that date lacks. */
export interface TaughtClassDetails {
  id: ClassId;
  name: string;
  startingCash: Rupiah;
  firstSessionDate: string | null;
}

/** The class of an address, which the lecturer who is signed in teaches. A student, a class that does not exist, and a class of another lecturer answer as an address that does not exist, so a guessed address reveals nothing. The url is the one that React Router gives a loader or an action. */
export function requireTaughtClass(
  context: Readonly<RouterContextProvider>,
  url: URL,
  classIdText: string,
): TaughtClassDetails {
  const lecturer = requireRole(context, url, "lecturer");
  const classId = parseRecordId<ClassId>(classIdText, "classId");
  const taught = classId.ok
    ? findTaughtClass(context.get(databaseContext), classId.value, lecturer.id)
    : undefined;
  if (taught === undefined) {
    throw data(null, { status: 404 });
  }
  return {
    id: taught.id,
    name: taught.name,
    startingCash: taught.startingCash,
    firstSessionDate: taught.firstSessionDate,
  };
}

/** The class of an address, which the lecturer who is signed in teaches, and the student of the address in it. A person who is not a student of that class answers as an address that does not exist, as a class that requireTaughtClass refuses does. */
export function requireTaughtStudent(
  context: Readonly<RouterContextProvider>,
  url: URL,
  params: { classId: string; studentId: string },
): { taughtClass: TaughtClassDetails; student: ClassStudent } {
  const taughtClass = requireTaughtClass(context, url, params.classId);
  const studentId = parseRecordId<UserId>(params.studentId, "studentId");
  const student = studentId.ok
    ? findClassStudent(
        context.get(databaseContext),
        taughtClass.id,
        studentId.value,
      )
    : undefined;
  if (student === undefined) {
    throw data(null, { status: 404 });
  }
  return { taughtClass, student };
}
