import type { Page } from "@playwright/test";
import { createStudent } from "../app/features/accounts/account-store.server.ts";
import { parseUsername } from "../app/features/accounts/username.ts";
import { joinClass } from "../app/features/classes/class-store.server.ts";
import type { TestClass } from "./create-test-class.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { chosenPassword, signInAndReturn, uniqueUsername } from "./accounts.ts";
import { writeTestDatabase } from "./write-test-database.ts";

/** Prepares an existing student for a test of another flow, so its setup consumes no request for a new account. Tests of signup and joining use the real forms instead, as e2e/AGENTS.md requires. */
export async function signInAsTestStudent(
  page: Page,
  testClass: TestClass,
  name: string,
): Promise<string> {
  const username = successValueForTest(
    parseUsername(uniqueUsername("mhs"), "The username of the test student"),
    "The generated username is valid",
  );
  const now = new Date();
  await writeTestDatabase(async (database) => {
    const studentId = await createStudent(
      database,
      { username, name, password: chosenPassword },
      now,
    );
    if (studentId === undefined) {
      throw new Error(`The test could not create the student "${username}".`);
    }
    joinClass(database, { classId: testClass.id, studentId }, now);
  });
  await page.goto(testClass.path);
  await signInAndReturn(page, {
    path: testClass.path,
    username,
    password: chosenPassword,
  });
  return username;
}
