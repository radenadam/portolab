import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { secondMilliseconds } from "../app/time-units.ts";
import { printedPasswordForTest } from "../app/features/accounts/printed-password-for-test.ts";
import type { AccountAction } from "../app/features/accounts/account-actions.ts";
import { parseFilePath } from "../app/value-parsers.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import { chooseLanguage } from "./choose-language.ts";
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

/** Fills the form that finishes or creates an account with a name, the username when the form asks for one, the chosen password twice, and consent, and sends it. */
async function submitAccountForm(
  page: Page,
  { name, username }: { name: string; username?: string },
): Promise<void> {
  await page.locator('main input[name="name"]').fill(name);
  if (username !== undefined) {
    await page.locator('main input[name="username"]').fill(username);
  }
  await page.locator('main input[name="newPassword"]').fill(chosenPassword);
  await page
    .locator('main input[name="repeatedPassword"]')
    .fill(chosenPassword);
  await page.locator('main input[name="consent"]').check();
  await page.locator("main form button[type=submit]").click();
}

/** Creates a lecturer with the account command, signs in, and finishes the account with a name, a password, and consent, so that the page ends signed in on the classes of the lecturer. */
export async function signInAsNewLecturer(
  page: Page,
  name: string,
): Promise<string> {
  const username = uniqueUsername("dosen");
  const temporaryPassword = runAccountCommand("create-lecturer", username);
  await page.goto("/sign-in");
  await submitSignIn(page, username, temporaryPassword);
  await expect(page).toHaveURL(/\/account\/setup/);
  await submitAccountForm(page, { name });
  await expect(page).toHaveURL("/classes");
  return username;
}

/** A class that a test created, with the path of its page and what its lecturer shares. */
export interface TestClass {
  path: string;
  joinCode: string;
  joinAddress: string;
}

/** Creates a class from the classes page of a lecturer who is signed in, and returns it from its page. */
export async function createTestClass(
  page: Page,
  name: string,
): Promise<TestClass> {
  await page.goto("/classes");
  await page.locator('main input[name="name"]').fill(name);
  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL(/\/classes\/\d+$/);
  const shared = page.locator("main dd");
  return {
    path: new URL(page.url()).pathname,
    joinCode: (await shared.nth(0).textContent()) ?? "",
    joinAddress: (await shared.nth(1).textContent()) ?? "",
  };
}

/** Opens the address of a class as a visitor, creates a student account on it, and returns the username, so that the page ends signed in on the page of the class. */
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

/** Opens a page in a context of its own, with the device of the project and a language, as the device of another person or a second device of the same person. The test closes its context. */
export async function newDevice(
  browser: Browser,
  locale: Locale,
): Promise<Page> {
  const {
    baseURL,
    viewport,
    userAgent,
    deviceScaleFactor,
    isMobile,
    hasTouch,
  } = test.info().project.use;
  const context = await browser.newContext({
    ...(baseURL === undefined ? {} : { baseURL }),
    ...(viewport === undefined ? {} : { viewport }),
    ...(userAgent === undefined ? {} : { userAgent }),
    ...(deviceScaleFactor === undefined ? {} : { deviceScaleFactor }),
    ...(isMobile === undefined ? {} : { isMobile }),
    ...(hasTouch === undefined ? {} : { hasTouch }),
  });
  const page = await context.newPage();
  await chooseLanguage(page, locale);
  return page;
}
