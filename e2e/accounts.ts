import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { secondMilliseconds } from "../app/time-units.ts";
import { printedPasswordForTest } from "../app/features/accounts/printed-password-for-test.ts";
import { createClassPath } from "../app/features/classes/class-path.ts";
import type { AccountAction } from "../app/features/accounts/account-actions.ts";
import { usernameLength } from "../app/features/accounts/username.ts";
import { testDatabasePath } from "./test-database-path.ts";

const accountCommandPath = join(
  import.meta.dirname,
  "..",
  "server",
  "account.ts",
);
const commandTimeoutSeconds = 30;

/** A password that every test account chooses, long enough for the rule of passwords. */
export const chosenPassword = "kopi pagi di kampus";

/** A username that no other test uses, because the tests of both projects share one database. It is as long as a username can be, in wide letters and without a place to break the line, so each screen that shows a username is checked with its widest content. */
export function uniqueUsername(prefix: string): string {
  const unique = randomUUID().slice(0, 8);
  return `${prefix}${"w".repeat(usernameLength.maximum - prefix.length - unique.length)}${unique}`;
}

/** How a test runs the account command of a server, without the action and the username that each run adds. */
export interface AccountCommand {
  file: string;
  arguments: readonly string[];
  environment: NodeJS.ProcessEnv;
}

/** The account command on the database of the test server, which the global setup started. */
function testServerAccountCommand(): AccountCommand {
  return {
    file: process.execPath,
    arguments: [accountCommandPath],
    environment: { ...process.env, DATABASE_PATH: testDatabasePath() },
  };
}

/** Runs the account command, as the person who runs a server would, on the test server unless the test names another server, and returns the temporary password that it prints. */
export function runAccountCommand(
  action: AccountAction,
  username: string,
  command: AccountCommand = testServerAccountCommand(),
): string {
  const output = execFileSync(
    command.file,
    [...command.arguments, action, username],
    {
      env: command.environment,
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

/** Fills the sign-in form, which a test reaches by any path, and sends it. The helper finds the form by its field for a password, which no other page has, so it waits for the sign-in page and never fills a field of the page before, such as the username on a join page. */
export async function submitSignIn(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const form = page
    .locator("main form")
    .filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="username"]').fill(username);
  await form.locator('input[name="password"]').fill(password);
  await form.locator("button[type=submit]").click();
}

/** Signs in on the sign-in page that a page sent the reader to, and checks that the sign-in page got the path of that page and returns there. */
export async function signInAndReturn(
  page: Page,
  {
    path,
    username,
    password,
  }: { path: string; username: string; password: string },
): Promise<void> {
  await expect(page).toHaveURL(`/sign-in?returnTo=${encodeURIComponent(path)}`);
  await submitSignIn(page, username, password);
  await expect(page).toHaveURL(path);
}

/** Fills the form that finishes or creates an account with a name, the username when the form asks for one, the chosen password twice, and consent, and sends it. */
export async function submitAccountForm(
  page: Page,
  { name, username }: { name: string; username?: string },
): Promise<void> {
  await page.locator('main input[name="name"]').fill(name);
  if (username !== undefined) {
    await page.locator('main input[name="username"]').fill(username);
  }
  await fillNewPassword(page, chosenPassword);
  await page.locator('main input[name="consent"]').check();
  await page.locator("main form button[type=submit]").click();
}

/** Fills the form that asks a person with a temporary password for a new one, and sends it. */
export async function submitNewPassword(
  page: Page,
  password: string,
): Promise<void> {
  await fillNewPassword(page, password);
  await page.locator("main form button[type=submit]").click();
}

/** Types a new password in its field and again in the field that repeats it. */
export async function fillNewPassword(
  page: Page,
  password: string,
): Promise<void> {
  await page.locator('main input[name="newPassword"]').fill(password);
  await page.locator('main input[name="repeatedPassword"]').fill(password);
}

/** Creates a lecturer with the account command of the test server, or of the server that the test names, signs in, and finishes the account with a name, a password, and consent, so that the page ends signed in on the form that creates the first class of the lecturer. */
export async function signInAsNewLecturer(
  page: Page,
  name: string,
  command?: AccountCommand,
): Promise<string> {
  const username = uniqueUsername("dosen");
  const temporaryPassword = runAccountCommand(
    "create-lecturer",
    username,
    command,
  );
  await page.goto("/sign-in");
  await submitSignIn(page, username, temporaryPassword);
  await expect(page).toHaveURL(/\/account\/setup/);
  await submitAccountForm(page, { name });
  await expect(page).toHaveURL(createClassPath);
  return username;
}

/** Exercises signup and joining through the real form and its limits. Other flows prepare an existing student with signInAsTestStudent, as e2e/AGENTS.md requires. Returns the username and leaves the student on the class page. */
export async function joinAsNewStudent(
  page: Page,
  joinAddress: string,
  name: string,
): Promise<string> {
  const username = uniqueUsername("mhs");
  await page.goto(joinAddress);
  await submitAccountForm(page, { name, username });
  await expect(page).toHaveURL(/\/classes\/\d+$/);
  return username;
}
