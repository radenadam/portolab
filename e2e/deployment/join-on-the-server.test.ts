import { expect, test } from "@playwright/test";
import { baseLocale } from "../../app/paraglide/runtime.js";
import { serverFolder, testDomain } from "../../scripts/deployment-guide.ts";
import { joinAsNewStudent, signInAsNewLecturer } from "../accounts.ts";
import type { AccountCommand } from "../accounts.ts";
import { createTestClass } from "../create-test-class.ts";
import { newDevice } from "../new-device.ts";
import { widestClassNames } from "../widest-class-names.ts";

const { className, lecturerName, studentName } = widestClassNames;

/** The account command in the container that the guide started, which the person who runs the server runs as root. */
const serverAccountCommand: AccountCommand = {
  file: "sudo",
  arguments: [
    "docker",
    "compose",
    "--project-directory",
    serverFolder,
    "exec",
    "--no-TTY",
    "app",
    "node",
    "server/account.ts",
  ],
  environment: process.env,
};

test("lets a student join a class at the address that its page shows, over HTTPS behind Caddy", async ({
  page,
  browser,
}) => {
  await signInAsNewLecturer(page, lecturerName, serverAccountCommand);
  // A browser keeps a cookie with the prefix __Host- only from a secure page, so the server knew from Caddy that the lecturer used HTTPS.
  const cookies = await page.context().cookies();
  expect(cookies.filter(({ name }) => name.startsWith("__Host-"))).toEqual([
    expect.objectContaining({ secure: true }),
  ]);
  const testClass = await createTestClass(page, className);
  // Caddy passes on the host that the lecturer opened, so the address for joining names the domain of the server.
  const joinAddress = `https://${testDomain}${testClass.joinPath}`;
  await expect(page.locator("main dd")).toHaveText([
    testClass.joinCode,
    joinAddress,
  ]);
  const student = await newDevice(browser, baseLocale);
  await joinAsNewStudent(student, joinAddress, studentName);
  await student.context().close();
});
