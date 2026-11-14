import { eq } from "drizzle-orm";
import { RouterContextProvider } from "react-router";
import { expect } from "vitest";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import type { Account } from "./account";
import { users } from "./accounts.schema";
import type { UserId } from "./accounts.schema";
import {
  createLecturer,
  createStudent,
  findAccountByUsername,
  findAccountWithPassword,
  updateAccount,
} from "./account-store.server";
import { currentSessionContext } from "./current-session.server";
import { verifyPassword } from "./password.server";
import { createSession, resumeSession } from "./session-store.server";
import type { Username } from "./username";
import { usernameForTest } from "./username-for-test";

/** Creates a lecturer for a test, as the account command does, and returns the account with its temporary password. */
export async function createTestLecturer(
  database: Database,
  usernameText: string,
): Promise<{ account: Account; temporaryPassword: string }> {
  const username = usernameForTest(usernameText);
  const temporaryPassword = await createLecturer(database, username);
  const account = findAccountByUsername(database, username);
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
  // A lecturer chooses a password of their own when finishing the account, which a test leaves out, because hashing it takes long.
  database
    .update(users)
    .set({ mustChangePassword: false })
    .where(eq(users.id, account.id))
    .run();
  return account.id;
}

/** Creates a student for a test, as joining a class does, and returns the id. */
export async function createTestStudent(
  database: Database,
  usernameText: string,
  name: string,
): Promise<UserId> {
  const username = usernameForTest(usernameText);
  const id = await createStudent(
    database,
    { username, name, password: "teh sore di taman" },
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

/** Gives the context of a test the session of a visitor who is not signed in, as the session middleware does for a request without a session. */
export function setVisitorForTest(context: RouterContextProvider): void {
  context.set(currentSessionContext, undefined);
}

/** The context that the server gives to a loader or a middleware of a person who is signed in at a moment, or of a visitor who is not signed in, with the database. */
export function readerContextForTest(
  database: Database,
  reader: { userId: UserId; now: Date } | undefined,
): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  if (reader === undefined) {
    setVisitorForTest(context);
  } else {
    context.set(
      currentSessionContext,
      resumeSession(
        database,
        createSession(database, reader.userId, reader.now),
        reader.now,
      ),
    );
  }
  return context;
}
