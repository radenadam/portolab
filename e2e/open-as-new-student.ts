import type { Browser, Page } from "@playwright/test";
import { studentOnNewClass } from "./student-on-new-class.ts";
import type { PortfolioOfTest } from "./student-with-portfolio.ts";
import { widestClassNames } from "./widest-class-names.ts";

/** Prepares an existing student of a new class with the widest names on the page of a test, such as a page that runs no JavaScript, lets the test give the student a portfolio, and opens a page of the class by its path within the class, such as /measures. The lecturer uses a device of their own, which the test closes. */
export async function openAsNewStudent(
  page: Page,
  browser: Browser,
  student: PortfolioOfTest & { path: string },
): Promise<{ lecturer: Page }> {
  const { lecturer, testClass } = await studentOnNewClass(page, browser, {
    locale: student.locale,
    ...widestClassNames,
  });
  student.givePortfolio?.(testClass.id);
  await page.goto(`${testClass.path}${student.path}`);
  return { lecturer };
}
