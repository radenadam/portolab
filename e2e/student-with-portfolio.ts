import type { Browser, Page } from "@playwright/test";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import type { Locale } from "../app/paraglide/runtime.js";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

/** The language of a test, and the portfolio that it gives the student, or none. */
export interface PortfolioOfTest {
  locale: Locale;
  givePortfolio?: ((classId: ClassId) => void) | undefined;
}

/** Creates a lecturer with a class and a student who joined it, each with the widest name, and lets a test give the student a portfolio. Returns the page of the student, which shows the class, and the path of the class. */
export async function studentWithPortfolio(
  page: Page,
  browser: Browser,
  { locale, givePortfolio }: PortfolioOfTest,
): Promise<{ student: Page; classPath: string }> {
  const { student, classId, classPath } = await studentOfNewClass(
    page,
    browser,
    { locale, ...widestClassNames },
  );
  givePortfolio?.(classId);
  return { student, classPath };
}
