import { studentReasonsSectionId } from "../app/features/trading/student-reasons-section-id.ts";
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
import { selectFirstStudent } from "./select-first-student.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { widestClassNames } from "./widest-class-names.ts";
import { reasonMaximumLength } from "../app/features/trading/reason-maximum-length.ts";
import { fieldMaximumLength } from "../app/form-size.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { wideWord } from "./wide-word.ts";

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
    close: string;
    workbook: string;
    portfolio: string;
    analysis: string;
    journal: string;
    reset: string;
    back: string;
    missing: string;
    headings: readonly string[];
    row: readonly string[];
    classLink: string;
    measureLink: string;
    allLink: string;
    measureHeading: string;
    portfolioTitle: string;
    portfolioLink: string;
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
      'Kolom "Cari nama atau nama pengguna" memuat paling banyak 8.000 karakter, tetapi isinya 8.001 karakter. Persingkat isinya.',
    portfolioTitle: `Portofolio ${widestClassNames.studentName} di ${widestClassNames.className}`,
    portfolioLink: `Portofolio ${widestClassNames.studentName}`,
    classLink: "Portofolio dan ukuran mahasiswa",
    measureLink: "Imbal hasil dan risiko portofolio ",
    allLink: "Kembali ke portofolio mahasiswa di ",
    measureHeading: "Ukuran portofolio",
    title: "Mahasiswa",
    search: "Cari nama atau nama pengguna",
    submit: "Cari",
    all: "Semua · 2",
    inactive: "Belum aktif minggu ini · 2",
    beta: "Beta di atas 1,00 · 0",
    count: "1 dari 2 mahasiswa tampil",
    noMatch:
      "Tidak ada mahasiswa yang cocok. Ubah pencarian atau pilih saringan Semua.",
    close: "Tutup panel mahasiswa",
    workbook: "Unduh workbook",
    portfolio: "Buka portofolio",
    analysis: "Analisis",
    journal: "Jurnal alasan",
    reset: "Atur ulang kata sandi",
    back: "Kembali ke mahasiswa",
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
      'The field "Search name or username" holds at most 8,000 characters, but it has 8,001. Shorten it.',
    portfolioTitle: `Portfolio of ${widestClassNames.studentName} in ${widestClassNames.className}`,
    portfolioLink: `Portfolio of ${widestClassNames.studentName}`,
    classLink: "Portfolios and measures of the students",
    measureLink: "Return and risk of the portfolio of ",
    allLink: "Back to the portfolios of the students in ",
    measureHeading: "Measures of the portfolio",
    title: "Students",
    search: "Search name or username",
    submit: "Search",
    all: "All · 2",
    inactive: "Inactive this week · 2",
    beta: "Beta above 1.00 · 0",
    count: "1 of 2 students shown",
    noMatch: "No students match. Change the search or choose the All filter.",
    close: "Close student panel",
    workbook: "Download workbook",
    portfolio: "Open portfolio",
    analysis: "Analysis",
    journal: "Reason journal",
    reset: "Reset password",
    back: "Back to students",
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
  test(`ranks the whole class, filters and searches it, selects a student, and exports the chosen measure in ${languageNames[locale]}`, async ({
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
    await selectFirstStudent(page);
    const panel = page.getByRole("dialog");
    await expect(
      panel.getByRole("heading", { name: widestClassNames.studentName }),
    ).toBeVisible();
    await expect(
      panel.getByRole("link", { name: text.portfolio, exact: true }),
    ).toHaveAttribute("href", /\/portfolio\?returnTo=/);
    await expect(
      panel.getByRole("link", { name: text.analysis, exact: true }),
    ).toHaveAttribute("href", /\/measures(?:\?|$)/);
    await expect(
      panel.getByRole("link", { name: text.journal, exact: true }),
    ).toHaveAttribute("href", new RegExp(`#${studentReasonsSectionId}$`));
    await expectAccessibleScreen(page);
    await panel.getByRole("link", { name: text.reset, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      text.resetTitle,
    );
    await expectAccessibleScreen(page);
    await page.getByRole("link", { name: text.back, exact: true }).click();
    await expect(page).toHaveURL(/measure=treynor.*student=\d+/);
    await page
      .getByRole("dialog")
      .getByRole("link", { name: text.close })
      .click();
    await expect(
      page.getByRole("searchbox", { name: text.search }),
    ).toHaveValue(widestClassNames.studentName);
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
    await expectAccessibleScreen(page);
    expect(await layoutProblems(page)).toEqual([]);
    await selectFirstStudent(page);
    if ((page.viewportSize()?.width ?? 0) < 1320)
      await page
        .getByRole("dialog")
        .getByRole("link", { name: text.close })
        .click();
    const second = page.locator("main tbody tr").nth(1).getByRole("link");
    await second.click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: text.close })
      .click();
    await expect(second).toBeFocused();
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

  test(`keeps the ranking, search, panel, and workbook usable before JavaScript in ${languageNames[locale]}`, async ({
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
    await selectFirstStudent(plain);
    await expect(
      plain
        .getByRole("dialog")
        .getByRole("link", { name: text.reset, exact: true }),
    ).toBeVisible();
    await expect(
      plain.getByRole("dialog").locator("svg").first(),
    ).toBeVisible();
    await plain
      .getByRole("dialog")
      .getByRole("link", { name: text.close })
      .click();
    await expect(
      plain.getByRole("searchbox", { name: text.search }),
    ).toHaveValue(widestClassNames.studentName);
    await plain.context().close();
    await student.context().close();
  });

  test(`opens the portfolio, analysis, and exact reason journal from the panel in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    const reason = wideWord("Alasan", reasonMaximumLength);
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestPurchases(classId, {
          ...itmgPortfolio,
          purchases: itmgPortfolio.purchases.map((purchase) => ({
            ...purchase,
            reason,
          })),
        });
      },
    });
    await page.goto(classPath);
    await page.getByRole("link", { name: text.classLink, exact: true }).click();
    await page.goto(
      `${classPath}/students?measure=treynor&q=${encodeURIComponent(widestClassNames.studentName)}`,
    );
    await selectFirstStudent(page);
    await expect(
      page.getByRole("dialog").getByText(reason, { exact: true }),
    ).toBeVisible();
    await expectAccessibleScreen(page);
    const selectedAddress = new URL(page.url());
    selectedAddress.hash = "#selected-student";
    await page.goto(selectedAddress.href);
    await page
      .getByRole("dialog")
      .getByRole("link", { name: text.close })
      .click();
    await expect(
      page.locator("main tbody tr").first().getByRole("link"),
    ).toBeFocused();
    await selectFirstStudent(page);
    await page
      .getByRole("dialog")
      .getByRole("link", { name: text.analysis, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: text.measureHeading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: text.portfolioLink, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: text.allLink + widestClassNames.className,
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("link", {
        name: text.allLink + widestClassNames.className,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(selectedAddress.href);
    await page
      .getByRole("dialog")
      .getByRole("link", { name: text.journal, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`#${studentReasonsSectionId}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      text.portfolioTitle,
    );
    await expect(page.locator(`#${studentReasonsSectionId}`)).toBeVisible();
    await page
      .getByRole("link", {
        name: text.measureLink + widestClassNames.studentName,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/measures(?:\?|$)/);
    await page
      .getByRole("link", {
        name: text.allLink + widestClassNames.className,
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(selectedAddress.href);
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
        return [
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
