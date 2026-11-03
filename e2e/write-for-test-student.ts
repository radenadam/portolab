import { join } from "node:path";
import { eq } from "drizzle-orm";
import {
  closeDatabase,
  openDatabase,
} from "../app/database/database.server.ts";
import type { Database } from "../app/database/database.server.ts";
import { migrationsFolderName } from "../app/database/migrations-folder-name.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import type {
  ClassId,
  MembershipId,
} from "../app/features/classes/classes.schema.ts";
import { testDatabasePath } from "./test-database-path.ts";

/** Opens the database of the test server, hands the place of the one student of a class of a test to a write, and closes the database again. */
export function writeForTestStudent(
  classId: ClassId,
  write: (database: Database, membershipId: MembershipId) => void,
): void {
  const database = openDatabase(
    testDatabasePath(),
    join(import.meta.dirname, "..", migrationsFolderName),
  );
  try {
    const membership = database
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.classId, classId))
      .get();
    if (membership === undefined) {
      throw new Error(
        `The class ${String(classId)} of the test has no student.`,
      );
    }
    write(database, membership.id);
  } finally {
    closeDatabase(database);
  }
}
