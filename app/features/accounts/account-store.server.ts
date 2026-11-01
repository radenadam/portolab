import { eq } from "drizzle-orm";
import type { Database } from "../../database/database.server.ts";
import { randomReadableText } from "../../random-text.server.ts";
import { accountColumns } from "./account.ts";
import type { Account } from "./account.ts";
import { users } from "./accounts.schema.ts";
import type { UserId } from "./accounts.schema.ts";
import { hashPassword } from "./password.server.ts";
import type { PasswordHash } from "./password.server.ts";
import { deleteSessionsOfUser } from "./session-store.server.ts";
import type { Username } from "./username.ts";

// Three groups of four characters carry 60 random bits, far more than the attempts that the limits on passwords allow, and the hyphens help a person copy them from a screen.
const temporaryPasswordGroups = 3;
const temporaryPasswordGroupLength = 4;

export function findAccountByUsername(
  database: Database,
  username: Username,
): Account | undefined {
  return database
    .select(accountColumns)
    .from(users)
    .where(eq(users.username, username))
    .get();
}

/** Finds the account with a username, with the hash of its password, which only the check of a password needs. */
export function findAccountWithPassword(
  database: Database,
  username: Username,
): { account: Account; passwordHash: PasswordHash } | undefined {
  return database
    .select({ account: accountColumns, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username))
    .get();
}

/** Finds the hash of the password of an account, which only the check of a password needs. */
export function findPasswordHash(
  database: Database,
  userId: UserId,
): PasswordHash | undefined {
  return database
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .get()?.passwordHash;
}

/** Creates the account of a lecturer with a temporary password and returns that password, or returns undefined when the username is taken. The lecturer gives a name and agrees to the privacy notice at the first sign-in. */
export async function createLecturer(
  database: Database,
  username: Username,
  now: Date,
): Promise<string | undefined> {
  const temporaryPassword = makeTemporaryPassword();
  const created = database
    .insert(users)
    .values({
      username,
      name: null,
      role: "lecturer",
      passwordHash: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      consentedAt: null,
      createdAt: now,
    })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id })
    .all();
  return created.length === 0 ? undefined : temporaryPassword;
}

/** Gives an account a temporary password, which this returns, and signs the person out on every device. The person chooses a new password at the next sign-in. */
export async function resetPassword(
  database: Database,
  userId: UserId,
): Promise<string> {
  const temporaryPassword = makeTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  database.transaction((transaction) => {
    transaction
      .update(users)
      .set({ passwordHash, mustChangePassword: true })
      .where(eq(users.id, userId))
      .run();
    deleteSessionsOfUser(transaction, userId);
  });
  return temporaryPassword;
}

/** Details of an account that a person gives, each only when it changes. */
export interface AccountChanges {
  name?: string;
  /** A password that the person chose, which replaces a temporary one too. */
  password?: string;
  consentedAt?: Date;
}

/** Saves details that a person gave. A new password signs the person out on every device, so that only a session that the caller starts afterwards holds it. */
export async function updateAccount(
  database: Database,
  userId: UserId,
  changes: AccountChanges,
): Promise<void> {
  const passwordHash =
    changes.password === undefined
      ? undefined
      : await hashPassword(changes.password);
  database.transaction((transaction) => {
    transaction
      .update(users)
      .set({
        ...(changes.name === undefined ? {} : { name: changes.name }),
        ...(changes.consentedAt === undefined
          ? {}
          : { consentedAt: changes.consentedAt }),
        ...(passwordHash === undefined
          ? {}
          : { passwordHash, mustChangePassword: false }),
      })
      .where(eq(users.id, userId))
      .run();
    if (passwordHash !== undefined) {
      deleteSessionsOfUser(transaction, userId);
    }
  });
}

function makeTemporaryPassword(): string {
  const groups: string[] = [];
  for (let group = 0; group < temporaryPasswordGroups; group += 1) {
    groups.push(randomReadableText(temporaryPasswordGroupLength));
  }
  return groups.join("-");
}
