import type { Browser, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { signInAsNewLecturer } from "./accounts.ts";
import { createTestClass } from "./create-test-class.ts";
import { expectMissingPage } from "./expect-missing-page.ts";
import { newDevice } from "./new-device.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

/** A reader of the addresses of a class of a test: its lecturer, the student who joined it, or the lecturer of another class. */
type ClassReader = "lecturer" | "student" | "otherLecturer";

/** An address that a test expects to answer its reader as an address that does not exist. */
interface MissingAddress {
  reader: ClassReader;
  path: string;
}

/** Creates a lecturer with a class and a student who joined it, and a lecturer with another class, and checks that each address that a test gives answers its reader as an address that does not exist. The test gives the addresses from the paths of both classes, and it can read them from the pages of the lecturer of the class. */
export async function expectMissingClassPages(
  page: Page,
  browser: Browser,
  {
    locale,
    notFoundTitle,
    addresses,
  }: {
    locale: Locale;
    notFoundTitle: string;
    addresses: (classes: {
      classPath: string;
      otherClassPath: string;
      lecturer: Page;
    }) => readonly MissingAddress[] | Promise<readonly MissingAddress[]>;
  },
): Promise<void> {
  const { student, classPath } = await studentOfNewClass(page, browser, {
    locale,
    ...widestClassNames,
  });
  const otherLecturer = await newDevice(browser, locale);
  await signInAsNewLecturer(otherLecturer, widestClassNames.lecturerName);
  const otherClass = await createTestClass(
    otherLecturer,
    widestClassNames.className,
  );
  const readers: Record<ClassReader, Page> = {
    lecturer: page,
    student,
    otherLecturer,
  };
  for (const { reader, path } of await addresses({
    classPath,
    otherClassPath: otherClass.path,
    lecturer: page,
  })) {
    await expectMissingPage(readers[reader], path, notFoundTitle);
  }
  await student.context().close();
  await otherLecturer.context().close();
}
