import type { Browser, Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { expectMissingPage } from "./expect-missing-page.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

/** Creates a lecturer with a class and a student who joined it, and checks that each address that a test gives from the address of the class answers its reader as an address that does not exist. */
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
    addresses: (
      classPath: string,
    ) => readonly { reader: "lecturer" | "student"; path: string }[];
  },
): Promise<void> {
  const { student, classPath } = await studentOfNewClass(page, browser, {
    locale,
    ...widestClassNames,
  });
  const readers = { lecturer: page, student };
  for (const { reader, path } of addresses(classPath)) {
    await expectMissingPage(readers[reader], path, notFoundTitle);
  }
  await student.context().close();
}
