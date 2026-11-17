import { expect, test } from "@playwright/test";
import { nimMaximumLength } from "../app/features/classes/nim-maximum-length.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { uniqueUsername, submitAccountForm } from "./accounts.ts";
import { captureScreens } from "./capture-screens.ts";
import { createTestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { newDevice } from "./new-device.ts";
import { selectFirstStudent } from "./select-first-student.ts";
import { storeGradingPortfolio } from "./store-grading-portfolio.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { widestClassNames } from "./widest-class-names.ts";

const texts: Record<
  Locale,
  {
    hint: string;
    save: string;
    saved: string;
    cleared: string;
    title: string;
    search: string;
    searchButton: string;
    open: string;
    join: string;
    long: string;
    far: string;
    format: string;
    analysis: string;
    journal: string;
    sections: string;
  }
> = {
  id: {
    hint: 'Opsional untuk kelas ini. Dosen Anda melihat NIM ini. Gunakan paling banyak 32 karakter dari A sampai Z, a sampai z, 0 sampai 9, ".", "/", atau "-". Kosongkan bila tidak ada.',
    save: "Simpan NIM",
    saved: "Portolab menyimpan NIM Anda untuk kelas ini.",
    cleared: "Portolab mengosongkan NIM Anda untuk kelas ini.",
    title: `NIM di ${widestClassNames.className}`,
    search: "Cari nama atau NIM",
    searchButton: "Cari",
    open: "Buka portofolio",
    join: "Gabung ke kelas",
    long: 'Kolom "NIM" memuat paling banyak 32 karakter, tetapi isinya 33 karakter. Persingkat isinya.',
    far: 'Kolom "NIM" berisi 32.768 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    format:
      'Kolom "NIM" berisi "bad nim", tetapi NIM hanya menerima karakter dari A sampai Z, a sampai z, 0 sampai 9, ".", "/", atau "-", dengan paling banyak 32 karakter. Perbaiki isinya atau kosongkan bila tidak ada.',
    analysis: "Analisis",
    journal: "Jurnal dan order",
    sections: "Bagian portofolio mahasiswa",
  },
  en: {
    hint: 'Optional for this class. Your lecturer sees this NIM. Use at most 32 characters from A to Z, a to z, 0 to 9, ".", "/", or "-". Leave it empty if you have none.',
    save: "Save NIM",
    saved: "Portolab saved your NIM for this class.",
    cleared: "Portolab cleared your NIM for this class.",
    title: `NIM in ${widestClassNames.className}`,
    search: "Search name or NIM",
    searchButton: "Search",
    open: "Open portfolio",
    join: "Join the class",
    long: 'The field "NIM" holds at most 32 characters, but it has 33. Shorten it.',
    far: 'The field "NIM" has 32,768 characters, more than this field takes. Fill it in with the text that it asks for.',
    format:
      'The field "NIM" holds "bad nim", but a NIM takes only characters from A to Z, a to z, 0 to 9, ".", "/", or "-", with at most 32 characters. Correct it or leave it empty if you have none.',
    analysis: "Analysis",
    journal: "Journal and orders",
    sections: "Student portfolio sections",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`corrects a NIM per class and shows it to the lecturer in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: storeGradingPortfolio,
    });
    try {
      await student.goto("/account");
      await expect(
        student.getByRole("heading", { name: text.title, exact: true }),
      ).toBeVisible();
      await expect(student.getByText(text.hint, { exact: true })).toBeVisible();
      const field = student.getByRole("textbox", { name: "NIM", exact: true });
      await expect(field).toHaveValue("");
      await field.fill("W".repeat(nimMaximumLength + 1));
      await student
        .getByRole("button", { name: text.save, exact: true })
        .click();
      await expect(student.getByText(text.long, { exact: true })).toBeVisible();
      await field.fill("W".repeat(32_768));
      await student
        .getByRole("button", { name: text.save, exact: true })
        .click();
      await expect(student.getByText(text.far, { exact: true })).toBeVisible();
      const nim = "W".repeat(nimMaximumLength);
      await field.fill(nim);
      await student
        .getByRole("button", { name: text.save, exact: true })
        .click();
      await expect(
        student.getByText(text.saved, { exact: true }),
      ).toBeVisible();
      await student.reload();
      await expect(field).toHaveValue(nim);
      await expectAccessibleScreen(student);
      await captureScreens(student, testInfo, {
        name: "nim-account",
        fullPage: true,
        fromTop: true,
      });
      await page.goto(`${classPath}/students`);
      const search = page.getByRole("searchbox", { name: text.search });
      await search.fill(nim.toLowerCase());
      await page
        .getByRole("button", { name: text.searchButton, exact: true })
        .click();
      await expect(page.locator("main tbody tr")).toHaveCount(1);
      await expect(page.locator("main tbody tr")).toContainText(nim);
      const identifier = page.locator("main tbody tr small").first();
      expect(
        await identifier.evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return (
            range.getBoundingClientRect().width <=
            element.getBoundingClientRect().width + 1
          );
        }),
      ).toBe(true);
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: "nim-students",
        fullPage: true,
        fromTop: true,
      });
      await selectFirstStudent(page);
      await expect(page.getByRole("dialog")).toContainText(nim);
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: "nim-panel",
        fullPage: false,
        fromTop: true,
      });
      await page
        .getByRole("dialog")
        .getByRole("link", { name: text.open, exact: true })
        .click();
      await expect(page.locator("main header").first()).toContainText(nim);
      await captureScreens(page, testInfo, {
        name: "nim-student-summary",
        fullPage: true,
        fromTop: true,
      });
      const tabs = page.getByRole("navigation", { name: text.sections });
      for (const [label, name] of [
        [text.analysis, "analysis"],
        [text.journal, "journal"],
      ] as const) {
        const tab = tabs.getByRole("link", { name: label, exact: true });
        await tab.click();
        await expect(tab).toHaveAttribute("aria-current", "page");
        await expect(page.locator("main header").first()).toContainText(nim);
        await expectAccessibleScreen(page);
        await captureScreens(page, testInfo, {
          name: `nim-student-${name}`,
          fullPage: true,
          fromTop: true,
        });
      }
      const other = await createTestClass(page, "Other NIM class");
      await student.goto(other.joinPath);
      await expect(field).toHaveValue("");
      await field.fill("0001/A-2.3");
      await captureScreens(student, testInfo, {
        name: "nim-join-existing",
        fullPage: true,
        fromTop: true,
      });
      const joiningTab = await newDevice(browser, locale, {
        storageState: await student.context().storageState(),
      });
      try {
        await joiningTab.goto(other.joinPath);
        await joiningTab
          .getByRole("textbox", { name: "NIM", exact: true })
          .fill("0001/A-2.3");
        await joiningTab
          .getByRole("button", { name: text.join, exact: true })
          .click();
        await expect(joiningTab).toHaveURL(other.path);
      } finally {
        await joiningTab.context().close();
      }
      await field.fill("bad nim");
      await student
        .getByRole("button", { name: text.join, exact: true })
        .click();
      await expect(student).toHaveURL(other.path);
      await student.goto("/account");
      const fields = student.locator('input[name="nim"]');
      await expect(fields.nth(0)).toHaveValue(nim);
      await expect(fields.nth(1)).toHaveValue("0001/A-2.3");
      await fields.nth(0).fill("");
      await student
        .getByRole("button", { name: text.save, exact: true })
        .nth(0)
        .click();
      await expect(
        student.getByText(text.cleared, { exact: true }),
      ).toBeVisible();
      await student.reload();
      await expect(fields.nth(0)).toHaveValue("");
      await expect(fields.nth(1)).toHaveValue("0001/A-2.3");
      const refused = await page.request.post("/account", {
        headers: { origin: new URL(page.url()).origin },
        form: { classId: String(other.id), nim: "forged" },
      });
      expect(refused.status()).toBe(404);
    } finally {
      await student.context().close();
    }
  });

  test(`keeps a NIM from signup through correction before JavaScript in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
    });
    const other = await createTestClass(page, "NIM signup");
    const visitor = await newDevice(browser, locale, {
      javaScriptEnabled: false,
    });
    try {
      await visitor.goto(other.joinPath);
      await visitor
        .getByRole("textbox", { name: "NIM", exact: true })
        .fill("bad nim");
      await visitor.locator("main form button[type=submit]").click();
      await expect(
        visitor.getByText(text.format, { exact: true }),
      ).toBeVisible();
      await visitor.goto(other.joinPath);
      const nim = "0".repeat(nimMaximumLength);
      await visitor
        .getByRole("textbox", { name: "NIM", exact: true })
        .fill(nim);
      await captureScreens(visitor, testInfo, {
        name: "nim-join-new",
        fullPage: true,
        fromTop: true,
      });
      const username = uniqueUsername("nim");
      expect(username).not.toContain(nim);
      expect(widestClassNames.studentName).not.toContain(nim);
      await submitAccountForm(visitor, {
        name: widestClassNames.studentName,
        username,
      });
      await expect(visitor).toHaveURL(other.path);
      await page.goto(`${other.path}/students`);
      await expect(page.locator("main tbody tr")).toContainText(nim);
      await page.getByRole("searchbox", { name: text.search }).fill(nim);
      await page
        .getByRole("button", { name: text.searchButton, exact: true })
        .click();
      await expect(page.locator("main tbody tr")).toHaveCount(1);
      await expect(page.locator("main tbody tr")).toContainText(nim);
      await expectAccessibleScreen(page);
      await captureScreens(page, testInfo, {
        name: "nim-digits-students",
        fullPage: true,
        fromTop: true,
      });
      await visitor.goto("/account");
      const field = visitor.getByRole("textbox", { name: "NIM", exact: true });
      await expect(field).toHaveValue(nim);
      await field.fill("00002-a");
      await visitor
        .getByRole("button", { name: text.save, exact: true })
        .click();
      await expect(
        visitor.getByText(text.saved, { exact: true }),
      ).toBeVisible();
      await visitor.reload();
      await expect(field).toHaveValue("00002-a");
      await student.goto(other.joinPath);
      await student
        .getByRole("button", { name: text.join, exact: true })
        .click();
      await expect(student).toHaveURL(other.path);
      await student.goto("/account");
      await expect(student.locator('input[name="nim"]').nth(0)).toHaveValue("");
      await expect(student.locator('input[name="nim"]').nth(1)).toHaveValue("");
      await page.goto(`${classPath}/students`);
    } finally {
      await visitor.context().close();
      await student.context().close();
    }
  });
}
