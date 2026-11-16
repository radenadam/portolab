import type { Database } from "../app/database/database.server.ts";
import { createStudent } from "../app/features/accounts/account-store.server.ts";
import type { UserId } from "../app/features/accounts/accounts.schema.ts";
import { parseUsername } from "../app/features/accounts/username.ts";
import type { Username } from "../app/features/accounts/username.ts";
import { joinClass } from "../app/features/classes/class-store.server.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { chosenPassword, uniqueUsername } from "./accounts.ts";

/** Setup for another flow creates an existing student without consuming a request for signup, as e2e/AGENTS.md requires. */
export async function createClassStudent(
  database: Database,
  classId: ClassId,
  {
    name,
    now,
    username: chosenUsername,
  }: { name: string; now: Date; username?: string },
): Promise<{ username: Username; studentId: UserId }> {
  const username = successValueForTest(
    parseUsername(
      chosenUsername ?? uniqueUsername("mhs"),
      "The username of the test student",
    ),
    "The generated username is valid",
  );
  const studentId = await createStudent(
    database,
    { username, name, password: chosenPassword },
    now,
  );
  if (studentId === undefined) {
    throw new Error(`The test could not create the student "${username}".`);
  }
  joinClass(database, { classId, studentId }, now);
  return { username, studentId };
}
