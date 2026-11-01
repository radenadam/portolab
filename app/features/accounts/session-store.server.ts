import { createHash, timingSafeEqual } from "node:crypto";
import { eq, lte } from "drizzle-orm";
import type {
  Database,
  DatabaseWriter,
} from "../../database/database.server.ts";
import { fail, succeed } from "../../result.ts";
import type { Result } from "../../result.ts";
import {
  isReadableText,
  randomReadableText,
} from "../../random-text.server.ts";
import { describeValue } from "../../value-shapes.ts";
import { accountColumns } from "./account.ts";
import type { Account } from "./account.ts";
import { sessions, users } from "./accounts.schema.ts";
import type { UserId } from "./accounts.schema.ts";
import { dayMilliseconds, hourMilliseconds } from "../../time-units.ts";
import { sessionInactivityDays } from "./account-limits.ts";

/** The value of the session cookie, which names a session and holds its secret. */
export type SessionToken = string & { readonly brand: "SessionToken" };

// Each part has 24 characters of five bits, which makes 120 random bits, as the guide of Lucia on sessions does.
const tokenPartLength = 24;
// Writing the time of every request would make every page wait for the one writer that SQLite allows, so the time is written at most once in this interval.
const usageRecordMilliseconds = hourMilliseconds;

/** How long a session and its cookie live after the last visit that the session recorded. A visit within the interval of usageRecordMilliseconds after it is not recorded, so the session lives through that interval as well, which keeps it for the days of sessionInactivityDays after every visit. */
export const sessionLifetimeMilliseconds =
  sessionInactivityDays * dayMilliseconds + usageRecordMilliseconds;

/** The session that the token of a request names, with the account that it signs in. */
export interface CurrentSession {
  id: string;
  account: Account;
  /** Whether this request extended the session, so that the cookie needs a new lifetime too. */
  wasExtended: boolean;
}

/** Starts a session for an account and returns its token, which only the cookie holds. */
export function createSession(
  database: Database,
  userId: UserId,
  now: Date,
): SessionToken {
  const id = randomReadableText(tokenPartLength);
  const secret = randomReadableText(tokenPartLength);
  database
    .insert(sessions)
    .values({ id, secretHash: hashSecret(secret), userId, lastUsedAt: now })
    .run();
  // The parts use only the characters that isSessionToken accepts, because randomReadableText writes them.
  return `${id}.${secret}` as SessionToken;
}

/** Reads the token from the session cookie of a request. */
export function parseSessionToken(
  value: unknown,
  source: string,
): Result<SessionToken, string> {
  if (typeof value === "string" && isSessionToken(value)) {
    return succeed(value);
  }
  return fail(
    `${source} must be two parts of ${String(tokenPartLength)} letters and digits joined by a dot, but it is ${describeValue(value)}.`,
  );
}

/** Finds the session that a token names and extends it, or returns undefined when the session does not exist, its secret differs, or it was unused for too long. */
export function resumeSession(
  database: Database,
  token: SessionToken,
  now: Date,
): CurrentSession | undefined {
  const [id = "", secret = ""] = token.split(".");
  const row = database
    .select({
      secretHash: sessions.secretHash,
      lastUsedAt: sessions.lastUsedAt,
      account: accountColumns,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .get();
  // The secrets are compared in constant time, so the time of an answer tells nothing about a guessed secret.
  if (
    row === undefined ||
    !timingSafeEqual(hashSecret(secret), row.secretHash)
  ) {
    return undefined;
  }
  const unusedMilliseconds = now.getTime() - row.lastUsedAt.getTime();
  if (unusedMilliseconds >= sessionLifetimeMilliseconds) {
    deleteSession(database, id);
    return undefined;
  }
  const wasExtended = unusedMilliseconds >= usageRecordMilliseconds;
  if (wasExtended) {
    database
      .update(sessions)
      .set({ lastUsedAt: now })
      .where(eq(sessions.id, id))
      .run();
  }
  return { id, account: row.account, wasExtended };
}

export function deleteSession(database: Database, id: string): void {
  database.delete(sessions).where(eq(sessions.id, id)).run();
}

/** Deletes every session whose lifetime ended, because its cookie never returns to end it. */
export function deleteExpiredSessions(database: Database, now: Date): void {
  database
    .delete(sessions)
    .where(
      lte(
        sessions.lastUsedAt,
        new Date(now.getTime() - sessionLifetimeMilliseconds),
      ),
    )
    .run();
}

/** Signs a person out on every device, which a new password requires. */
export function deleteSessionsOfUser(
  database: DatabaseWriter,
  userId: UserId,
): void {
  database.delete(sessions).where(eq(sessions.userId, userId)).run();
}

function isSessionToken(text: string): text is SessionToken {
  const parts = text.split(".");
  return (
    parts.length === 2 &&
    parts.every(
      (part) => part.length === tokenPartLength && isReadableText(part),
    )
  );
}

function hashSecret(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}
