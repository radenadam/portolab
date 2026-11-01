import { eq, inArray } from "drizzle-orm";
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
    })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id })
    .all();
  return created.length === 0 ? undefined : temporaryPassword;
}

/** A person as the other people of a class see them. */
export interface Person {
  id: UserId;
  name: string;
  username: Username;
}

/** Finds the people with these ids, such as the students of a class or the lecturers of classes, by id. Other features show a person through this, so the rules of the table of accounts stay in this feature. */
export function findPeople(
  database: Database,
  ids: readonly UserId[],
): Map<UserId, Person> {
  const people = new Map<UserId, Person>();
  const rows = database
    .select({ id: users.id, name: users.name, username: users.username })
    .from(users)
    .where(inArray(users.id, [...ids]))
    .all();
  for (const row of rows) {
    // Only a lecturer whom the server owner created has no name, until the first sign-in finishes the account. Such a lecturer has no class yet, and every student gives a name when joining, so a person whom others see without a name is a broken database.
    if (row.name === null) {
      throw new Error(
        `The account "${row.username}" appears to other people but has no name.`,
      );
    }
    people.set(row.id, { id: row.id, name: row.name, username: row.username });
  }
  return people;
}

/** What a student gives to create an account while joining a class. */
export interface NewStudent {
  username: Username;
  name: string;
  password: string;
}

/** Creates the account of a student, who agreed to the privacy notice and chose a password while joining a class, and returns its id, or returns undefined when the username is taken. */
export async function createStudent(
  database: Database,
  student: NewStudent,
  now: Date,
): Promise<UserId | undefined> {
  const [created] = database
    .insert(users)
    .values({
      username: student.username,
      name: student.name,
      role: "student",
      passwordHash: await hashPassword(student.password),
      mustChangePassword: false,
      consentedAt: now,
    })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id })
    .all();
  return created?.id;
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
