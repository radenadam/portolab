import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { Result } from "~/result";
import { successValueForTest } from "~/success-value-for-test";
import {
  parseAccountCommand,
  runAccountCommand,
} from "./account-command.server";
import type { AccountCommand } from "./account-command.server";
import { findAccountByUsername } from "./account-store.server";
import { expectPassword } from "./accounts-for-test.server";
import { printedPasswordForTest } from "./printed-password-for-test";
import { createSession, resumeSession } from "./session-store.server";

const now = new Date("2026-11-02T03:00:00.000Z");

test("reads an action and a username from the command line", () => {
  expect(
    parseAccountCommand(["create-lecturer", "Dosen"], "The command line"),
  ).toEqual({
    ok: true,
    value: { action: "create-lecturer", username: "dosen" },
  });
  expect(
    parseAccountCommand(["reset-password", "dosen"], "The command line"),
  ).toEqual({
    ok: true,
    value: { action: "reset-password", username: "dosen" },
  });
});

test("names every wrong part of the command line at once", () => {
  expect(parseAccountCommand([], "The command line")).toEqual({
    ok: false,
    failure:
      'The action must be "create-lecturer" or "reset-password", but it is missing. The username must be 3 to 32 characters from a to z, 0 to 9, ".", "-", and "_", but it is missing.',
  });
  expect(
    parseAccountCommand(["create-student", "dosen"], "The command line"),
  ).toEqual({
    ok: false,
    failure:
      'The action must be "create-lecturer" or "reset-password", but it is "create-student".',
  });
  expect(
    parseAccountCommand(
      ["create-lecturer", "dosen", "extra"],
      "The command line",
    ),
  ).toEqual({
    ok: false,
    failure:
      'The command line must hold an action and a username, but it is ["create-lecturer","dosen","extra"].',
  });
});

/** Reads a command line as the account command does. */
function command(commandLine: readonly string[]): AccountCommand {
  return successValueForTest(
    parseAccountCommand(commandLine, "The command line"),
    `The command line ${JSON.stringify(commandLine)} is valid`,
  );
}

/** The temporary password that a run of the command printed. */
function printedPassword(result: Result<string, string>): string {
  return (result.ok ? printedPasswordForTest(result.value) : undefined) ?? "";
}

test("creates a lecturer and prints the temporary password with what the lecturer does with it", async () => {
  const database = openDatabaseForTest();
  const create = command(["create-lecturer", "dosen"]);
  const result = await runAccountCommand(database, create);
  const temporaryPassword = printedPassword(result);
  expect(result).toEqual({
    ok: true,
    value: `Portolab created the lecturer account "dosen". Its temporary password is:

  ${temporaryPassword}

Give it to the lecturer, who signs in with it, gives a name, chooses a new password, and agrees to the privacy notice.`,
  });
  await expectPassword(database, create.username, temporaryPassword);
});

test("creates no lecturer for a username that is taken, and points to the reset", async () => {
  const database = openDatabaseForTest();
  await runAccountCommand(database, command(["create-lecturer", "dosen"]));
  expect(
    await runAccountCommand(database, command(["create-lecturer", "dosen"])),
  ).toEqual({
    ok: false,
    failure: `The username "dosen" is taken, so Portolab created no account. Choose another username, or give that account a new password with the action "reset-password".`,
  });
});

test("gives an account a temporary password, signs it out on every device, and prints the password", async () => {
  const database = openDatabaseForTest();
  const create = command(["create-lecturer", "dosen"]);
  await runAccountCommand(database, create);
  const account = findAccountByUsername(database, create.username);
  if (account === undefined) {
    throw new Error("The command created no account.");
  }
  const token = createSession(database, account.id, now);
  const result = await runAccountCommand(
    database,
    command(["reset-password", "dosen"]),
  );
  const temporaryPassword = printedPassword(result);
  expect(result).toEqual({
    ok: true,
    value: `Portolab signed the account "dosen" out on every device and gave it a temporary password:

  ${temporaryPassword}

Give it to the owner of the account, who signs in with it and chooses a new password. When wrong passwords blocked the account, the block lasts until the time that the sign-in page names, because the server keeps it apart from this command.`,
  });
  expect(resumeSession(database, token, now)).toBeUndefined();
  await expectPassword(database, create.username, temporaryPassword);
});

test("resets nothing for a username without an account, and points to the creation of a lecturer", async () => {
  const database = openDatabaseForTest();
  expect(
    await runAccountCommand(database, command(["reset-password", "nobody"])),
  ).toEqual({
    ok: false,
    failure: `Portolab has no account with the username "nobody". Check the username, or create a lecturer with the action "create-lecturer".`,
  });
});
