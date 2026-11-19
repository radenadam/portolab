import { expect, test } from "@playwright/test";
import { openFirstStudent } from "./open-first-student.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { layoutProblems } from "./expect-layout.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";

const screenshotWidths = [360, 1440, 1920];
const widths = [360, 1280, 1319, 1320, 1440, 1920];
const backLinks: Record<Locale, string> = {
  id: "‹ Kembali ke mahasiswa",
  en: "‹ Back to students",
};

for (const locale of locales) {
  test(`opens a student from anywhere on the row, marks only the row that the lecturer came back from, and captures the Peta comparison at every width in ${languageNames[locale]}`, async ({
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
    const firstRow = page.locator("main tbody tr").first();
    const capture = async (name: string, width: number): Promise<void> => {
      if (screenshotWidths.includes(width))
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${name}-${String(width)}.png`),
          fullPage: true,
          scale: "css",
        });
    };
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${classPath}/students`);
        await expect(
          page.locator('main tbody [aria-current="true"]'),
        ).toHaveCount(0);
        expect(await layoutProblems(page)).toEqual([]);
        await capture(`${colorScheme}-list`, width);
        // The link of the name covers its whole row, so a tap at the far end of the row, away from the name, opens the student too.
        const row = await firstRow.boundingBox();
        if (row === null)
          throw new Error("Mahasiswa shows the row of a student.");
        await page.mouse.click(row.x + row.width - 4, row.y + row.height / 2);
        await expect(page).toHaveURL(/\/students\/\d+\?returnTo=/);
        await page.goBack();
        await openFirstStudent(page);
        expect(await layoutProblems(page)).toEqual([]);
        await capture(`${colorScheme}-student`, width);
        await page
          .getByRole("link", { name: backLinks[locale], exact: true })
          .click();
        await expect(page).toHaveURL(/student=(\d+)#student-\1$/);
        await expect(firstRow.getByRole("link")).toHaveAttribute(
          "aria-current",
          "true",
        );
        await expect(
          page.locator('main tbody [aria-current="true"]'),
        ).toHaveCount(1);
        expect(await layoutProblems(page)).toEqual([]);
        await capture(`${colorScheme}-marked`, width);
      }
    }
    await student.context().close();
  });
}
