import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  createLecturer,
  findAccountWithPassword,
  resetPassword,
  updateAccount,
} from "./account-store.server";
import { createTestLecturer, expectPassword } from "./accounts-for-test.server";
import { createSession, resumeSession } from "./session-store.server";

const now = new Date("2026-11-02T03:00:00.000Z");

test("creates a lecturer with a temporary password and nothing that the lecturer has not given", async () => {
  const database = openDatabaseForTest();
  const { account, temporaryPassword } = await createTestLecturer(
    database,
    "dosen",
  );
  expect(temporaryPassword).toMatch(
    /^[a-km-np-z2-9]{4}(-[a-km-np-z2-9]{4}){2}$/,
  );
  expect(account).toEqual({
    id: account.id,
    username: "dosen",
    name: null,
    role: "lecturer",
    mustChangePassword: true,
    consentedAt: null,
  });
  await expectPassword(database, account.username, temporaryPassword);
});

test("creates no account for a username that is taken", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  expect(await createLecturer(database, account.username)).toBeUndefined();
});

test("resets a password to a temporary one and signs the person out on every device", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  await updateAccount(database, account.id, {
    name: "Budi Santoso",
    password: "kopi pagi di kampus",
    consentedAt: now,
  });
  const token = createSession(database, account.id, now);
  const temporaryPassword = await resetPassword(database, account.id);
  expect(resumeSession(database, token, now)).toBeUndefined();
  expect(
    findAccountWithPassword(database, account.username)?.account
      .mustChangePassword,
  ).toBe(true);
  await expectPassword(database, account.username, temporaryPassword);
});

test("saves the details that a person gives, and signs the person out on every device only for a new password", async () => {
  const database = openDatabaseForTest();
  const { account } = await createTestLecturer(database, "dosen");
  const token = createSession(database, account.id, now);
  await updateAccount(database, account.id, {
    name: "Budi Santoso",
    consentedAt: now,
  });
  expect(resumeSession(database, token, now)?.account).toEqual({
    ...account,
    name: "Budi Santoso",
    consentedAt: now,
  });
  await updateAccount(database, account.id, {
    password: "kopi pagi di kampus",
  });
  expect(resumeSession(database, token, now)).toBeUndefined();
  expect(findAccountWithPassword(database, account.username)?.account).toEqual({
    ...account,
    name: "Budi Santoso",
    consentedAt: now,
    mustChangePassword: false,
  });
  await expectPassword(database, account.username, "kopi pagi di kampus");
});
