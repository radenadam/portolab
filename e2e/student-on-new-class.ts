import type { Browser, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { signInAsNewLecturer } from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import type { TestClass } from "./create-test-class.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";

/** Prepares a lecturer with a class on a device of their own, and an existing student on the page of a test, such as a page that runs no JavaScript, in a language and with the names of the test. Returns the device of the lecturer, which the test closes, and the class. */
export async function studentOnNewClass(
  page: Page,
  browser: Browser,
  {
    locale,
    className,
    lecturerName,
    studentName,
  }: {
    locale: Locale;
    className: string;
    lecturerName: string;
    studentName: string;
  },
): Promise<{ lecturer: Page; testClass: TestClass }> {
  const lecturer = await newDevice(browser, locale);
  await signInAsNewLecturer(lecturer, lecturerName);
  const testClass = await createTestClass(lecturer, className);
  await chooseLanguage(page, locale);
  await signInAsTestStudent(page, testClass, studentName);
  return { lecturer, testClass };
}
