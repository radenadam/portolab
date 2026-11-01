import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { databaseContext } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { createTestStudent } from "./accounts-for-test.server";
import {
  createPasswordLimiters,
  passwordLimitersContext,
  signIn,
} from "./password-attempts.server";
import { resetForgottenPassword } from "./reset-forgotten-password.server";
import { parseUsername } from "./username";

const now = new Date("2026-11-02T03:00:00.000Z");
const network = "192.0.2.1";

test("gives a temporary password with which a person who reached the limit of wrong passwords signs in at once", async () => {
  const database = openDatabaseForTest();
  const limiters = createPasswordLimiters();
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(passwordLimitersContext, limiters);
  const id = await createTestStudent(database, "sari", "Sari Dewi");
  const username = parseUsername("sari", "The username of the test");
  if (!username.ok) {
    throw new Error(username.failure);
  }
  // Ten wrong passwords for the username reach its limit.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    limiters.byUsername.startAttempt(username.value, now);
  }
  const temporaryPassword = await resetForgottenPassword(context, {
    id,
    username: username.value,
  });
  const signedIn = await signIn(database, limiters, {
    username: "sari",
    password: temporaryPassword,
    address: network,
    now,
  });
  expect(signedIn).toMatchObject({
    ok: true,
    value: { id, mustChangePassword: true },
  });
});
