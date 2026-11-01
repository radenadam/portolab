import { createContext } from "react-router";
import { createAttemptLimiter } from "~/create-attempt-limiter.server";
import type { AttemptLimiter } from "~/create-attempt-limiter.server";
import type { Database } from "~/database/database.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Account } from "./account";
import type { UserId } from "./accounts.schema";
import {
  findAccountWithPassword,
  findPasswordHash,
} from "./account-store.server";
import { passwordLimits } from "./account-limits";
import { hashPassword, verifyPassword } from "./password.server";
import type { PasswordHash } from "./password.server";
import { isUsername, normalizeUsername } from "./username";

export interface PasswordLimiters {
  byUsername: AttemptLimiter;
  byAddress: AttemptLimiter;
}

export function createPasswordLimiters(): PasswordLimiters {
  return {
    byUsername: createAttemptLimiter(passwordLimits.byUsername),
    byAddress: createAttemptLimiter(passwordLimits.byAddress),
  };
}

// The server keeps the limiters with its other services, so the dev server can reload this module after an edit without forgetting the attempts.
export const passwordLimitersContext = createContext<PasswordLimiters>();

/** Why a password was not accepted. A blocked attempt names the moment when its key may try again. */
export type PasswordFailure =
  | { kind: "wrongPassword" }
  | { kind: "usernameBlocked"; until: Date }
  | { kind: "addressBlocked"; until: Date };

/** An attempt to give a password, with the address of the network that it came from. */
export interface PasswordAttempt {
  username: string;
  password: string;
  address: string;
  now: Date;
}

/** Finds the account that a username and a password sign in. A username without an account takes as long and fails in the same way as a wrong password, so the answer never tells whether a username exists. */
export async function signIn(
  database: Database,
  limiters: PasswordLimiters,
  attempt: PasswordAttempt,
): Promise<Result<Account, PasswordFailure>> {
  const username = normalizeUsername(attempt.username);
  const found = isUsername(username)
    ? findAccountWithPassword(database, username)
    : undefined;
  const passwordHash = found?.passwordHash ?? (await hashForMissingAccount());
  return checkWithinLimits(limiters, { ...attempt, username }, async () => {
    const matches = await verifyPassword(attempt.password, passwordHash);
    return matches ? found?.account : undefined;
  });
}

/** Checks the password of a person who is signed in, such as before a change of the password, within the same limits as a sign-in. */
export async function checkPassword(
  database: Database,
  limiters: PasswordLimiters,
  attempt: PasswordAttempt & { userId: UserId },
): Promise<Result<true, PasswordFailure>> {
  const passwordHash =
    findPasswordHash(database, attempt.userId) ??
    (await hashForMissingAccount());
  return checkWithinLimits(limiters, attempt, async () => {
    const matches = await verifyPassword(attempt.password, passwordHash);
    return matches ? true : undefined;
  });
}

/** Runs a check of a password unless the address or the username reached its limit. The check gives its value when the password is right, and undefined when it is wrong. */
async function checkWithinLimits<Value>(
  limiters: PasswordLimiters,
  attempt: PasswordAttempt,
  check: () => Promise<Value | undefined>,
): Promise<Result<Value, PasswordFailure>> {
  const { username, address, now } = attempt;
  const addressBlockedUntil = limiters.byAddress.startAttempt(address, now);
  if (addressBlockedUntil !== undefined) {
    return fail({ kind: "addressBlocked", until: addressBlockedUntil });
  }
  const usernameBlockedUntil = limiters.byUsername.startAttempt(username, now);
  if (usernameBlockedUntil !== undefined) {
    // The address made no attempt at a password, because the block of the username stopped it first.
    limiters.byAddress.takeBack(address, now);
    return fail({ kind: "usernameBlocked", until: usernameBlockedUntil });
  }
  const value = await check();
  if (value === undefined) {
    return fail({ kind: "wrongPassword" });
  }
  limiters.byAddress.takeBack(address, now);
  limiters.byUsername.forget(username);
  return succeed(value);
}

// A username without an account is checked against this hash, so that its answer takes as long as one for a wrong password.
let missingAccountHash: Promise<PasswordHash> | undefined;

function hashForMissingAccount(): Promise<PasswordHash> {
  missingAccountHash ??= hashPassword("a password that no account has");
  return missingAccountHash;
}
