import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { readZipForTest } from "../app/workbook/read-zip-for-test.server.ts";
import { readTestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { layoutProblems } from "./expect-layout.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";
import { openFirstStudent } from "./open-first-student.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { fieldMaximumLength } from "../app/form-size.ts";

const texts: Record<
  Locale,
  {
    title: string;
    search: string;
    submit: string;
    all: string;
    inactive: string;
    beta: string;
    count: string;
    noMatch: string;
    workbook: string;
    reset: string;
    back: string;
    studentBack: string;
    missing: string;
    headings: readonly string[];
    row: readonly string[];
    sharpeValue: string;
    treynorValue: string;
    resetTitle: string;
    searchTooLong: string;
  }
> = {
  id: {
    sharpeValue: "-0,20",
    treynorValue: "-1,55%",
    resetTitle: "Atur ulang kata sandi",
    searchTooLong:
      'Kolom "Cari nama, NIM, atau nama pengguna" memuat paling banyak 8.000 karakter, tetapi isinya 8.001 karakter. Persingkat isinya.',
    title: "Mahasiswa",
    search: "Cari nama, NIM, atau nama pengguna",
    submit: "Cari",
    all: "Semua · 2",
    inactive: "Belum aktif minggu ini · 2",
    beta: "Beta di atas 1,00 · 0",
    count: "1 dari 2 mahasiswa",
    noMatch:
      "Tidak ada mahasiswa yang cocok. Ubah pencarian atau pilih saringan Semua.",
    workbook: "Unduh workbook",
    reset: "Atur ulang kata sandi",
    back: "‹ Kembali ke mahasiswa",
    studentBack: `Kembali ke ${widestClassNames.studentName}`,
    missing: "Halaman tidak ditemukan",
    headings: [
      "Nama",
      "Nama pengguna",
      "Alpha Jensen",
      "Sharpe",
      "Treynor",
      "Alasan portofolio belum memiliki ukuran",
    ],
    row: ["+0,33%", "0,34", "2,59%", "-0,38%"],
  },
  en: {
    sharpeValue: "-0.20",
    treynorValue: "-1.55%",
    resetTitle: "Reset a password",
    searchTooLong:
      'The field "Search name, NIM, or username" holds at most 8,000 characters, but it has 8,001. Shorten it.',
    title: "Students",
    search: "Search name, NIM, or username",
    submit: "Search",
    all: "All · 2",
    inactive: "Inactive this week · 2",
    beta: "Beta above 1.00 · 0",
    count: "1 of 2 students",
    noMatch: "No students match. Change the search or choose the All filter.",
    workbook: "Download workbook",
    reset: "Reset password",
    back: "‹ Back to students",
    studentBack: `Back to ${widestClassNames.studentName}`,
    missing: "Page not found",
    headings: [
      "Name",
      "Username",
      "Jensen's alpha",
      "Sharpe",
      "Treynor",
      "Why the portfolio has no measures",
    ],
    row: ["+0.33%", "0.34", "2.59%", "-0.38%"],
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`ranks the whole class, filters and searches it, opens a student from the row, and exports the chosen measure in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: storeGradingPortfolio,
    });
    await page.goto(classPath);
    const testClass = await readTestClass(page);
    const other = await newDevice(browser, locale);
    await signInAsTestStudent(other, testClass, "Student without shares");
    await page.goto(`${classPath}/students`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      text.title,
    );
    await expect(page.locator("main tbody tr")).toHaveCount(2);
    for (const value of text.row)
      await expect(page.locator("main tbody tr").first()).toContainText(value);
    await expect(
      page.getByRole("link", { name: text.inactive, exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Sharpe", exact: true }).click();
    await expect(page).toHaveURL(/measure=sharpe/);
    await expect(page.locator("main tbody tr").first()).toContainText(
      text.sharpeValue,
    );
    await page.getByRole("link", { name: "Treynor", exact: true }).click();
    await expect(page).toHaveURL(/measure=treynor/);
    await expect(page.locator("main tbody tr").first()).toContainText(
      text.treynorValue,
    );
    await page.getByRole("link", { name: text.beta, exact: true }).click();
    await expect(page.locator("main tbody tr")).toHaveCount(0);
    await expect(page.getByText(text.noMatch, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: text.all, exact: true }).click();
    await expect(page.locator("main tbody tr")).toHaveCount(2);
    await page
      .getByRole("searchbox", { name: text.search })
      .fill(widestClassNames.studentName);
    await page.getByRole("button", { name: text.submit, exact: true }).click();
    await expect(page.locator("main tbody tr")).toHaveCount(1);
    await expect(page.getByText(text.count, { exact: true })).toBeVisible();
    await openFirstStudent(page);
    const studentPage = page.url();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      widestClassNames.studentName,
    );
    await expectAccessibleScreen(page);
    // The reset of a password acts on the student whose page is open, so it leads back to that page.
    await page
      .getByRole("main")
      .getByRole("link", { name: text.reset, exact: true })
      .click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      text.resetTitle,
    );
    await expectAccessibleScreen(page);
    await page
      .getByRole("link", { name: text.studentBack, exact: true })
      .click();
    await expect(page).toHaveURL(studentPage);
    await page.getByRole("link", { name: text.back, exact: true }).click();
    await expect(page).toHaveURL(/measure=treynor.*student=(\d+)#student-\1$/);
    await expect(
      page.getByRole("searchbox", { name: text.search }),
    ).toHaveValue(widestClassNames.studentName);
    // Only the row of the student whom the lecturer came back from is marked, so the lecturer keeps their place.
    await expect(
      page.locator("main tbody tr").first().getByRole("link"),
    ).toHaveAttribute("aria-current", "true");
    await expect(page.locator('main tbody [aria-current="true"]')).toHaveCount(
      1,
    );
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: text.workbook, exact: true }).click();
    const workbook = await download;
    const chunks: Buffer[] = [];
    for await (const chunk of await workbook.createReadStream())
      chunks.push(chunk as Buffer);
    const sheet = new TextDecoder().decode(
      readZipForTest(new Uint8Array(Buffer.concat(chunks))).get(
        "xl/worksheets/sheet1.xml",
      ),
    );
    for (const heading of text.headings) expect(sheet).toContain(heading);
    expect(sheet).toContain("Student without shares");
    await page.goto(`${classPath}/students`);
    await expect(page.locator('main tbody [aria-current="true"]')).toHaveCount(
      0,
    );
    await expectAccessibleScreen(page);
    expect(await layoutProblems(page)).toEqual([]);
    await page
      .getByRole("searchbox", { name: text.search })
      .fill("W".repeat(fieldMaximumLength + 1));
    const invalidSearch = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/students") &&
        response.status() === 400,
    );
    await page.getByRole("button", { name: text.submit, exact: true }).click();
    await invalidSearch;
    await expect(
      page.getByRole("searchbox", { name: text.search }),
    ).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("alert")).toHaveText(text.searchTooLong);
    await student.context().close();
    await other.context().close();
  });

  test(`keeps the ranking, the search, and the rows that open a student usable before JavaScript in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: storeGradingPortfolio,
    });
    const plain = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      storageState: await page.context().storageState(),
    });
    await plain.goto(`${classPath}/students`);
    await plain.getByRole("link", { name: "Sharpe", exact: true }).click();
    await expect(plain).toHaveURL(/measure=sharpe/);
    await plain
      .getByRole("searchbox", { name: text.search })
      .fill(widestClassNames.studentName);
    await plain.getByRole("button", { name: text.submit, exact: true }).click();
    await openFirstStudent(plain);
    await expect(
      plain
        .getByRole("main")
        .getByRole("link", { name: text.reset, exact: true }),
    ).toBeVisible();
    await plain.getByRole("link", { name: text.back, exact: true }).click();
    await expect(plain).toHaveURL(/measure=sharpe.*student=(\d+)#student-\1$/);
    await expect(
      plain.getByRole("searchbox", { name: text.search }),
    ).toHaveValue(widestClassNames.studentName);
    await plain.context().close();
    await student.context().close();
  });

  test(`refuses access to another class and a selected student outside the class in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.missing,
      addresses: async ({ classPath, otherClassPath, lecturer }) => {
        await lecturer.goto(classPath);
        await lecturer.goto(`${classPath}/students`);
        const address = await lecturer
          .locator("main tbody tr")
          .first()
          .getByRole("link")
          .getAttribute("href");
        if (address === null)
          throw new Error("The selected student has a portfolio address.");
        const studentPath = new URL(address, lecturer.url()).pathname;
        return [
          ...["", "/analysis", "/journal"].flatMap((suffix) => [
            { reader: "student" as const, path: studentPath + suffix },
            { reader: "otherLecturer" as const, path: studentPath + suffix },
            {
              reader: "lecturer" as const,
              path: `${classPath}/students/999999999${suffix}`,
            },
          ]),
          { reader: "lecturer", path: studentPath + "/portfolio" },
          { reader: "lecturer", path: studentPath + "/measures" },
          { reader: "student", path: `${classPath}/students` },
          { reader: "student", path: `${classPath}/workbook` },
          { reader: "otherLecturer", path: `${classPath}/students` },
          { reader: "otherLecturer", path: `${classPath}/workbook` },
          {
            reader: "lecturer",
            path: `${classPath}/students?student=999999999`,
          },
          { reader: "lecturer", path: `${otherClassPath}/students` },
        ];
      },
    });
  });
}
