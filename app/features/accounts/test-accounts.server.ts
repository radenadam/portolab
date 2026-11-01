import { expect } from "vitest";
import type { Database } from "~/database/database.server";
import type { Account } from "./account";
import type { UserId } from "./accounts.schema";
import {
  createLecturer,
  createStudent,
  findAccountByUsername,
  findAccountWithPassword,
  updateAccount,
} from "./account-store.server";
import { verifyPassword } from "./password.server";
import { parseUsername } from "./username";
import type { Username } from "./username";

/** Creates a lecturer for a test, as the account command does, and returns the account with its temporary password. */
export async function createTestLecturer(
  database: Database,
  usernameText: string,
): Promise<{ account: Account; temporaryPassword: string }> {
  const username = parseUsername(usernameText, "The username of the test");
  if (!username.ok) {
    throw new Error(username.failure);
  }
  const temporaryPassword = await createLecturer(database, username.value);
  const account = findAccountByUsername(database, username.value);
  if (temporaryPassword === undefined || account === undefined) {
    throw new Error(`The test could not create the lecturer ${usernameText}.`);
  }
  return { account, temporaryPassword };
}

/** Creates a lecturer for a test who finished the account, as a lecturer must before teaching a class, and returns the id. */
export async function createReadyTestLecturer(
  database: Database,
  usernameText: string,
  name: string,
): Promise<UserId> {
  const { account } = await createTestLecturer(database, usernameText);
  await updateAccount(database, account.id, {
    name,
    consentedAt: new Date("2026-11-02T03:00:00.000Z"),
  });
  return account.id;
}

/** Creates a student for a test, as joining a class does, and returns the id. */
export async function createTestStudent(
  database: Database,
  usernameText: string,
  name: string,
): Promise<UserId> {
  const username = parseUsername(usernameText, "The username of the test");
  if (!username.ok) {
    throw new Error(username.failure);
  }
  const id = await createStudent(
    database,
    { username: username.value, name, password: "teh sore di taman" },
    new Date("2026-11-02T03:00:00.000Z"),
  );
  if (id === undefined) {
    throw new Error(`The test could not create the student ${usernameText}.`);
  }
  return id;
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
