import { expect, test } from "@playwright/test";
import { selectFirstStudent } from "./select-first-student.ts";
import { locales } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { layoutProblems } from "./expect-layout.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";

const screenshotWidths = [360, 1440, 1920];
const widths = [360, 1280, 1319, 1320, 1440, 1920];

for (const locale of locales) {
  test(`keeps the student panel in a sheet below its docking width and captures the Peta comparison in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "phone",
      "The phone project supplies touch at every width of this walk.",
    );
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      {
        locale,
        className: "Manajemen Portofolio A",
        lecturerName: "Dosen Kelas",
        studentName: "Sari Wulandari",
      },
    );
    storeGradingPortfolio(classId);
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${classPath}/students`);
        expect(await layoutProblems(page)).toEqual([]);
        if (screenshotWidths.includes(width))
          await page.screenshot({
            path: testInfo.outputPath(
              `${locale}-${colorScheme}-${String(width)}-list.png`,
            ),
            fullPage: true,
            scale: "css",
          });
        await selectFirstStudent(page);
        const panel = page.getByRole("dialog");
        await expect(panel).toBeVisible();
        await expect
          .poll(() => panel.evaluate((element) => element.matches(":modal")))
          .toBe(width < 1320);
        expect(await layoutProblems(page)).toEqual([]);
        if (width >= 1320)
          expect(await page.evaluate(() => window.scrollY)).toBe(0);
        if (screenshotWidths.includes(width))
          await page.screenshot({
            path: testInfo.outputPath(
              `${locale}-${colorScheme}-${String(width)}-panel.png`,
            ),
            fullPage: true,
            scale: "css",
          });
        if (width < 1320) {
          await page.keyboard.press("Escape");
          await expect(page).not.toHaveURL(/student=/);
          await expect(panel).not.toBeVisible();
          await expect(
            page.locator("main tbody tr").first().getByRole("link"),
          ).toBeFocused();
        }
      }
    }
    await student.context().close();
  });
}
