import type { Browser, Page } from "@playwright/test";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import { joinAsNewStudent, signInAsNewLecturer } from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import { newDevice } from "./new-device.ts";

/** Creates a lecturer with a class and a student who joined it on a device of their own, in a language and with the names of a test. Returns the page of the student, which shows the class, and the class. */
export async function studentOfNewClass(
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
): Promise<{ student: Page; classId: ClassId; classPath: string }> {
  await chooseLanguage(page, locale);
  await signInAsNewLecturer(page, lecturerName);
  const testClass = await createTestClass(page, className);
  const student = await newDevice(browser, locale);
  await joinAsNewStudent(student, testClass.joinPath, studentName);
  return { student, classId: testClass.id, classPath: testClass.path };
}
