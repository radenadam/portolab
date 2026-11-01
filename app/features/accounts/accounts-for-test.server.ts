import { expect } from "vitest";
import type { Database } from "~/database/database.server";
import { successValueForTest } from "~/success-value-for-test";
import type { Account } from "./account";
import {
  createLecturer,
  findAccountByUsername,
  findAccountWithPassword,
} from "./account-store.server";
import { verifyPassword } from "./password.server";
import { parseUsername } from "./username";
import type { Username } from "./username";

/** Creates a lecturer for a test, as the account command does, and returns the account with its temporary password. */
export async function createTestLecturer(
  database: Database,
  usernameText: string,
): Promise<{ account: Account; temporaryPassword: string }> {
  const username = successValueForTest(
    parseUsername(usernameText, "The username of the test"),
    `The username ${usernameText} is valid`,
  );
  const temporaryPassword = await createLecturer(database, username);
  const account = findAccountByUsername(database, username);
  if (temporaryPassword === undefined || account === undefined) {
    throw new Error(`The test could not create the lecturer ${usernameText}.`);
  }
  return { account, temporaryPassword };
}

/** Checks that the account with a username signs in with a password. */
export async function expectPassword(
  database: Database,
  username: Username,
  password: string,
): Promise<void> {
  const found = findAccountWithPassword(database, username);
  expect(
    found !== undefined && (await verifyPassword(password, found.passwordHash)),
  ).toBe(true);
}
