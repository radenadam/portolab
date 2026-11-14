import { data } from "react-router";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { parseRecordId } from "~/value-parsers";
import { isReaderClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";

/** The class of an address, which the person who is signed in teaches or joined, for a page that both its lecturer and its students open, such as the market of the class. A class that does not exist and a class of other people answer as an address that does not exist, so a guessed address reveals nothing. The url is the one that React Router gives a loader or an action. */
export function requireReaderClass(
  context: Readonly<RouterContextProvider>,
  url: URL,
  classIdText: string,
): ClassId {
  const reader = requireUser(context, url);
  const classId = parseRecordId<ClassId>(classIdText, "classId");
  if (
    !classId.ok ||
    !isReaderClass(context.get(databaseContext), reader, classId.value)
  ) {
    throw data(null, { status: 404 });
  }
  return classId.value;
}
