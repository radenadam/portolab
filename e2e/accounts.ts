import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { secondMilliseconds } from "../app/time-units.ts";
import { printedPasswordForTest } from "../app/features/accounts/printed-password-for-test.ts";
import type { AccountAction } from "../app/features/accounts/account-actions.ts";
import { parseFilePath } from "../app/value-parsers.ts";
import { databasePathVariable } from "./test-server.ts";

const accountCommand = join(import.meta.dirname, "..", "server", "account.ts");
const commandTimeoutSeconds = 30;

/** A password that every test account chooses, long enough for the rule of passwords. */
export const chosenPassword = "kopi pagi di kampus";

// The longest username that Portolab accepts, of wide letters, so each screen that shows a username is checked with its widest content.
const usernameLength = 32;

/** A username that no other test uses, because the tests of both projects share one database, as long and as wide as a username can be. */
export function uniqueUsername(prefix: string): string {
  const unique = randomUUID().slice(0, 8);
  return `${prefix}${"w".repeat(usernameLength - prefix.length - unique.length - 1)}-${unique}`;
}

/** Runs the account command on the database of the test server, as the person who runs a server would, and returns the temporary password that it prints. */
export function runAccountCommand(
  action: AccountAction,
  username: string,
): string {
  const databasePath = parseFilePath(
    process.env[databasePathVariable],
    databasePathVariable,
  );
  if (!databasePath.ok) {
    throw new Error(databasePath.failure);
  }
  const output = execFileSync(
    process.execPath,
    [accountCommand, action, username],
    {
      env: { ...process.env, DATABASE_PATH: databasePath.value },
      encoding: "utf8",
      timeout: commandTimeoutSeconds * secondMilliseconds,
    },
  );
  const temporaryPassword = printedPasswordForTest(output);
  if (temporaryPassword === undefined) {
    throw new Error(
      `The account command printed no temporary password. It printed: ${output}`,
    );
  }
  return temporaryPassword;
}

/** Fills the sign-in form, which a test reaches by any path, and sends it. */
export async function submitSignIn(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.locator('main input[name="username"]').fill(username);
  await page.locator('main input[name="password"]').fill(password);
  await page.locator("main form button[type=submit]").click();
}

/** Creates a lecturer with the account command, signs in, and finishes the account with a name, a password, and consent, so that the page ends signed in on the home page. */
export async function signInAsNewLecturer(
  page: Page,
  name: string,
): Promise<string> {
  const username = uniqueUsername("dosen");
  const temporaryPassword = runAccountCommand("create-lecturer", username);
  await page.goto("/sign-in");
  await submitSignIn(page, username, temporaryPassword);
  await expect(page).toHaveURL(/\/account\/setup/);
  await page.locator('main input[name="name"]').fill(name);
  await page.locator('main input[name="newPassword"]').fill(chosenPassword);
  await page
    .locator('main input[name="repeatedPassword"]')
    .fill(chosenPassword);
  await page.locator('main input[name="consent"]').check();
  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL("/");
  return username;
}
