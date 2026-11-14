import type { Browser, Page } from "@playwright/test";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import type { Rupiah } from "../app/units/rupiah.ts";
import { signInAsNewLecturer } from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";

/** Prepares a lecturer with a class and an existing student on a device of their own, in a language and with the names of a test. Returns the page of the student, which shows the class, and the class. */
export async function studentOfNewClass(
  page: Page,
  browser: Browser,
  {
    locale,
    className,
    lecturerName,
    studentName,
    startingCash,
  }: {
    locale: Locale;
    className: string;
    lecturerName: string;
    studentName: string;
    startingCash?: Rupiah;
  },
): Promise<{ student: Page; classId: ClassId; classPath: string }> {
  await chooseLanguage(page, locale);
  await signInAsNewLecturer(page, lecturerName);
  const testClass = await createTestClass(page, className, startingCash);
  const student = await newDevice(browser, locale);
  await signInAsTestStudent(student, testClass, studentName);
  return { student, classId: testClass.id, classPath: testClass.path };
}
