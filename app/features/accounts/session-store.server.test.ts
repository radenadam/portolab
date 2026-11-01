import { dayMilliseconds, hourMilliseconds } from "~/time-units";
import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createTestLecturer } from "./accounts-for-test.server";
import {
  createSession,
  deleteExpiredSessions,
  deleteSession,
  deleteSessionsOfUser,
  parseSessionToken,
  resumeSession,
} from "./session-store.server";
import type { SessionToken } from "./session-store.server";

const start = new Date("2026-11-02T03:00:00.000Z");

function later(milliseconds: number): Date {
  return new Date(start.getTime() + milliseconds);
}

test("finds the session that a token names, with the account that it signs in", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const token = createSession(database, account.id, start);
  expect(resumeSession(database, token, later(1000))).toEqual({
    id: token.split(".")[0],
    account,
    wasExtended: false,
  });
});

test("finds no session for a token whose secret differs", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const token = createSession(database, account.id, start);
  const [id] = token.split(".");
  const forged = `${String(id)}.${"a".repeat(24)}` as SessionToken;
  expect(resumeSession(database, forged, start)).toBeUndefined();
});

test("extends a session at most once an hourMilliseconds, and ends it after 14 days without a visit", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const token = createSession(database, account.id, start);
  expect(
    resumeSession(database, token, later(hourMilliseconds - 1))?.wasExtended,
  ).toBe(false);
  expect(
    resumeSession(database, token, later(hourMilliseconds))?.wasExtended,
  ).toBe(true);
  expect(
    resumeSession(
      database,
      token,
      later(hourMilliseconds + 14 * dayMilliseconds - 1),
    )?.wasExtended,
  ).toBe(true);
  const lastVisit = later(hourMilliseconds + 14 * dayMilliseconds - 1);
  expect(
    resumeSession(
      database,
      token,
      new Date(lastVisit.getTime() + 14 * dayMilliseconds),
    ),
  ).toBeUndefined();
  expect(resumeSession(database, token, lastVisit)).toBeUndefined();
});

test("deletes the sessions that were unused for 14 days, and keeps the others", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const unused = createSession(database, account.id, start);
  const used = createSession(database, account.id, later(dayMilliseconds));
  deleteExpiredSessions(database, later(14 * dayMilliseconds));
  expect(resumeSession(database, unused, start)).toBeUndefined();
  expect(resumeSession(database, used, later(dayMilliseconds))).toBeDefined();
});

test("ends one session, or every session of a person", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const first = createSession(database, account.id, start);
  const second = createSession(database, account.id, start);
  const third = createSession(database, account.id, start);
  deleteSession(database, first.split(".")[0] ?? "");
  expect(resumeSession(database, first, start)).toBeUndefined();
  expect(resumeSession(database, second, start)).toBeDefined();
  deleteSessionsOfUser(database, account.id);
  expect(resumeSession(database, second, start)).toBeUndefined();
  expect(resumeSession(database, third, start)).toBeUndefined();
});

test("reads a token that createSession made, and rejects any other value of the cookie with what it is", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const token = createSession(database, account.id, start);
  expect(parseSessionToken(token, "The cookie portolab_session")).toEqual({
    ok: true,
    value: token,
  });
  for (const value of [
    "",
    "abc.def",
    `${token}.extra`,
    token.replace(".", ""),
    token.toUpperCase(),
    token.replace(/^./, "l"),
    {},
  ]) {
    expect(parseSessionToken(value, "The cookie portolab_session")).toEqual({
      ok: false,
      failure: `The cookie portolab_session must be two parts of 24 letters and digits joined by a dot, but it is ${value === "" ? "empty" : JSON.stringify(value)}.`,
    });
  }
});
