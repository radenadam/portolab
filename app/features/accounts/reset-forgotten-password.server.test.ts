import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { databaseContext } from "~/database/database.server";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import { passwordLimits } from "./account-limits";
import { createTestStudent } from "./accounts-for-test.server";
import {
  createPasswordLimiters,
  passwordLimitersContext,
  signIn,
} from "./password-attempts.server";
import { resetForgottenPassword } from "./reset-forgotten-password.server";
import { usernameForTest } from "./username-for-test";

const now = new Date("2026-11-02T03:00:00.000Z");
const network = "192.0.2.1";

test("gives a temporary password with which a person who reached the limit of wrong passwords signs in at once", async () => {
  const database = openDatabaseForTest();
  const limiters = createPasswordLimiters();
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(passwordLimitersContext, limiters);
  const id = await createTestStudent(database, "sari", "Sari Dewi");
  const username = usernameForTest("sari");
  for (
    let attempt = 0;
    attempt < passwordLimits.byUsername.failures;
    attempt += 1
  ) {
    limiters.byUsername.startAttempt(username, now);
  }
  const signInWith = (password: string) =>
    signIn(database, limiters, {
      username: "sari",
      password,
      address: network,
      now,
    });
  expect(await signInWith("teh sore di taman")).toMatchObject({
    ok: false,
    failure: { kind: "usernameBlocked" },
  });
  const temporaryPassword = await resetForgottenPassword(context, {
    id,
    username,
  });
  expect(await signInWith(temporaryPassword)).toMatchObject({
    ok: true,
    value: { id, mustChangePassword: true },
  });
});
