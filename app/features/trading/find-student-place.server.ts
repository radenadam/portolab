import { data } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireRole } from "~/features/accounts/current-session.server";
import { findJoinedClass } from "~/features/classes/class-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { parseRecordId } from "~/value-parsers";
import type { PortfolioOwner } from "./portfolio-store.server";

/** A class that the student who is signed in joined, with the portfolio of the student in it. */
export interface StudentPlace {
  classId: ClassId;
  className: string;
  owner: PortfolioOwner;
}

/** The class of an address and the portfolio of the student who is signed in. A lecturer, a class that does not exist, and a class that the student did not join answer as an address that does not exist, so a guessed address reveals nothing. The url is the one that React Router gives a loader or an action. */
export function findStudentPlace(
  context: Readonly<RouterContextProvider>,
  url: URL,
  classIdText: string,
): StudentPlace {
  const student = requireRole(context, url, "student");
  const notFound = data(null, { status: 404 });
  const classId = parseRecordId<ClassId>(classIdText, "classId");
  if (!classId.ok) {
    throw notFound;
  }
  const joined = findJoinedClass(
    context.get(databaseContext),
    classId.value,
    student.id,
  );
  if (joined === undefined) {
    throw notFound;
  }
  return {
    classId: joined.id,
    className: joined.name,
    owner: {
      membershipId: joined.membershipId,
      startingCash: joined.startingCash,
    },
  };
}
