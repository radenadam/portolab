import { RouterContextProvider } from "react-router";
import { clientAddressContext } from "~/client-address.server";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import {
  createReadyTestLecturer,
  setVisitorForTest,
} from "~/features/accounts/accounts-for-test.server";
import { defaultStartingCash } from "./class-rules";
import { createClass, findTaughtClass } from "./class-store.server";
import type { ClassId } from "./classes.schema";
import type { JoinCode } from "./join-code";
import {
  createJoinLimiters,
  joinLimitersContext,
} from "./join-limiters.server";
import type { JoinLimiters } from "./join-limiters.server";

/** The address of the one network from which the requests of a test come. */
export const networkForTest = "192.0.2.1";

/** The context that the server gives to a loader or an action of a visitor who is not signed in, with the database, limits on joining, and the address of one network. A test passes the limiters when it fills them itself. */
export function joinContextForTest(
  database: Database,
  limiters: JoinLimiters = createJoinLimiters(),
): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(joinLimitersContext, limiters);
  context.set(clientAddressContext, networkForTest);
  setVisitorForTest(context);
  return context;
}

/** Creates a class of a lecturer for a test, with the default starting cash, and returns its id and its code. */
export function createClassForTest(
  database: Database,
  lecturerId: UserId,
  name: string,
): { classId: ClassId; joinCode: JoinCode } {
  const classId = createClass(
    database,
    { lecturerId, name, startingCash: defaultStartingCash },
    new Date("2026-11-02T03:00:00.000Z"),
  );
  const taught = findTaughtClass(database, classId, lecturerId);
  if (taught === undefined) {
    throw new Error(`The test could not create the class ${name}.`);
  }
  return { classId, joinCode: taught.joinCode };
}

/** Creates the ready lecturer Budi Santoso, who signs in as dosen, with the class Manajemen Portofolio A, which most tests of classes need, and returns the ids of both and the code of the class. */
export async function createLecturerWithClassForTest(
  database: Database,
): Promise<{ lecturerId: UserId; classId: ClassId; joinCode: JoinCode }> {
  const lecturerId = await createReadyTestLecturer(
    database,
    "dosen",
    "Budi Santoso",
  );
  return {
    lecturerId,
    ...createClassForTest(database, lecturerId, "Manajemen Portofolio A"),
  };
}
