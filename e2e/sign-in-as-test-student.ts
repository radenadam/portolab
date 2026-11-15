import type { Page } from "@playwright/test";
import type { TestClass } from "./create-test-class.ts";
import { chosenPassword, signInAndReturn } from "./accounts.ts";
import { createClassStudent } from "./create-class-student.ts";
import { writeTestDatabase } from "./write-test-database.ts";

/** Prepares an existing student for a test of another flow, so its setup consumes no request for a new account. Tests of signup and joining use the real forms instead, as e2e/AGENTS.md requires. */
export async function signInAsTestStudent(
  page: Page,
  testClass: TestClass,
  name: string,
): Promise<string> {
  const now = new Date();
  const { username } = await writeTestDatabase((database) =>
    createClassStudent(database, testClass.id, { name, now }),
  );
  await page.goto(testClass.path);
  await signInAndReturn(page, {
    path: testClass.path,
    username,
    password: chosenPassword,
  });
  return username;
}
