import { users } from "./accounts.schema.ts";
import type { Role, UserId } from "./accounts.schema.ts";
import type { Username } from "./username.ts";

/** What Portolab knows about a person, without the hash of the password. */
export interface Account {
  id: UserId;
  username: Username;
  /** Missing until a lecturer whom the server owner created gives it at the first sign-in. */
  name: string | null;
  role: Role;
  mustChangePassword: boolean;
  /** Missing until the person agrees to the privacy notice. */
  consentedAt: Date | null;
}

/** The columns of the table of users that make an account, for a query that selects one. */
export const accountColumns = {
  id: users.id,
  username: users.username,
  name: users.name,
  role: users.role,
  mustChangePassword: users.mustChangePassword,
  consentedAt: users.consentedAt,
};

/** A person who finished setting up the account, so every page may serve them. */
export interface User {
  id: UserId;
  username: Username;
  name: string;
  role: Role;
  consentedAt: Date;
}

/** The steps that an account still needs before Portolab serves the person: a name, a password of their own, and their consent. */
export interface MissingSteps {
  name: boolean;
  password: boolean;
  consent: boolean;
}

export function missingSteps(account: Account): MissingSteps {
  return {
    name: account.name === null,
    password: account.mustChangePassword,
    consent: account.consentedAt === null,
  };
}

/** The person as every page serves them, or undefined while the account still misses a step. */
export function readyUser(account: Account): User | undefined {
  if (!isReady(account)) {
    return undefined;
  }
  return {
    id: account.id,
    username: account.username,
    name: account.name,
    role: account.role,
    consentedAt: account.consentedAt,
  };
}

function isReady(
  account: Account,
): account is Account & { name: string; consentedAt: Date } {
  const steps = missingSteps(account);
  return !steps.name && !steps.password && !steps.consent;
}
