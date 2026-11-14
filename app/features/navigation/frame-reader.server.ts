import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import type { User } from "~/features/accounts/account";
import {
  readySignedInUser,
  requireUser,
  signedInRole,
} from "~/features/accounts/current-session.server";
import { createClassPath } from "~/features/classes/class-path";
import { listReaderClasses } from "~/features/classes/class-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { termOf } from "~/features/classes/course-calendar";
import { readLastClassId } from "~/features/classes/last-class.server";
import { parseRecordId } from "~/value-parsers";
import { workspaceHomePath } from "./frame-navigation";
import type { FrameReader, WorkspaceClass } from "./frame-reader";
import { workspaceClassOf } from "./workspace-class-of";

/** Who reads a page with an address of the given parameters, with the workspace of the class of the address, of the class that the person opened last, or of the class that the person joined or created last. */
export async function readFrameReader(
  context: Readonly<RouterContextProvider>,
  request: Request,
  params: Readonly<Record<string, string | undefined>>,
): Promise<FrameReader> {
  if (signedInRole(context) === undefined) {
    return { kind: "visitor" };
  }
  const user = readySignedInUser(context);
  if (user === undefined) {
    return { kind: "settingUp" };
  }
  const classes = workspaceClasses(context.get(databaseContext), user);
  const addressed = parseRecordId<ClassId>(params["classId"], "classId");
  const current = workspaceClassOf(classes, {
    addressed: addressed.ok ? addressed.value : undefined,
    lastOpened: await readLastClassId(request),
  });
  return {
    kind: "user",
    role: user.role,
    name: user.name,
    workspace: current === undefined ? undefined : { current, classes },
  };
}

/** Where a person who is signed in lands, as decision 0030 sets it: the home of the class that the person opened last, or of the class that the person joined or created last. A student without a class lands on joining one, and a lecturer without a class on creating one. A person who still has to finish the account goes to that step first. The url is the one that React Router gives a loader. */
export async function landingPath(
  context: Readonly<RouterContextProvider>,
  request: Request,
  url: URL,
): Promise<string> {
  const user = requireUser(context, url);
  const workspaceClass = workspaceClassOf(
    workspaceClasses(context.get(databaseContext), user),
    { addressed: undefined, lastOpened: await readLastClassId(request) },
  );
  if (workspaceClass !== undefined) {
    return workspaceHomePath(user.role, workspaceClass.id);
  }
  switch (user.role) {
    case "student":
      return "/join";
    case "lecturer":
      return createClassPath;
  }
}

function workspaceClasses(database: Database, user: User): WorkspaceClass[] {
  const readerClasses = listReaderClasses(database, user);
  switch (readerClasses.role) {
    case "lecturer":
      return readerClasses.classes.map((taught) => ({
        id: taught.id,
        name: taught.name,
        term: termOrNone(taught.firstSessionDate),
        people: { kind: "students", count: taught.studentCount },
      }));
    case "student":
      return readerClasses.classes.map((joined) => ({
        id: joined.id,
        name: joined.name,
        term: termOrNone(joined.firstSessionDate),
        people: { kind: "lecturer", name: joined.lecturerName },
      }));
  }
}

function termOrNone(firstSessionDate: string | null): WorkspaceClass["term"] {
  return firstSessionDate === null ? undefined : termOf(firstSessionDate);
}
