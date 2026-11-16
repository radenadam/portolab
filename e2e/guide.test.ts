import { expect, test } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { locales } from "../app/paraglide/runtime.js";
import { guideSectionIds } from "../app/features/learning/guide-section-ids.ts";
import { languageNames } from "../app/language-names.ts";
import { signInAsNewLecturer } from "./accounts.ts";
import { captureScreens } from "./capture-screens.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingPage } from "./expect-missing-page.ts";
import { layoutProblems } from "./expect-layout.ts";
import { openProfileMenu } from "./frame.ts";
import { holdClientScripts } from "./hold-client-scripts.ts";
import { newDevice } from "./new-device.ts";
import { signInAsTestStudent } from "./sign-in-as-test-student.ts";
import { widestClassNames } from "./widest-class-names.ts";

const texts: Record<
  Locale,
  {
    guide: string;
    title: string;
    contents: string;
    prices: string;
    privacy: string;
    notFound: string;
  }
> = {
  id: {
    guide: "Panduan",
    title: "Panduan dosen",
    contents: "Isi panduan",
    prices: "Harga tertunda dan kegagalan pembaruan",
    privacy: "pemberitahuan privasi",
    notFound: "Halaman tidak ditemukan",
  },
  en: {
    guide: "Guide",
    title: "Lecturer guide",
    contents: "Guide contents",
    prices: "Delayed prices and failed updates",
    privacy: "privacy notice",
    notFound: "Page not found",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`reads the lecturer guide with and without JavaScript in ${languageNames[locale]}`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120_000);
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, widestClassNames.lecturerName);
    const profile = await openProfileMenu(page);
    await profile.getByRole("link", { name: text.guide, exact: true }).click();
    await expect(page).toHaveURL("/guide");
    await expect(page).toHaveTitle(`${text.title} | Portolab`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      text.title,
    );
    await expect(page.locator("main section")).toHaveCount(
      guideSectionIds.length,
    );
    await expectAccessibleScreen(page);
    await captureScreens(page, testInfo, {
      name: `guide-${locale}`,
      fullPage: true,
      fromTop: true,
      check: async () => {
        expect(await layoutProblems(page)).toEqual([]);
      },
    });
    await testInfo.attach(`guide-${locale}`, {
      body: await page.locator("main").innerText(),
      contentType: "text/plain",
    });

    await holdClientScripts(page, { address: "/guide" }, async (loadClient) => {
      await page.getByText(text.contents, { exact: true }).click();
      await page.getByRole("link", { name: text.prices, exact: true }).click();
      await expect(page).toHaveURL(/\/guide#prices$/u);
      await expect(page.locator("#prices-title")).toBeInViewport();
      await loadClient();
      await expect(page.locator("main details")).toHaveAttribute("open", "");
      await expect(page.locator("#prices-title")).toBeInViewport();
    });

    const noScript = await newDevice(browser, locale, {
      javaScriptEnabled: false,
      sessionFrom: page,
    });
    try {
      await noScript.goto("/guide");
      await noScript.getByText(text.contents, { exact: true }).click();
      const link = noScript.getByRole("link", {
        name: text.prices,
        exact: true,
      });
      await link.focus();
      await noScript.keyboard.press("Enter");
      await expect(noScript.locator("#prices-title")).toBeInViewport();
      await noScript
        .getByRole("link", { name: text.privacy, exact: true })
        .click();
      await expect(noScript).toHaveURL("/privacy");
      await noScript.goBack();
      await expect(noScript).toHaveURL(/\/guide#prices$/u);
    } finally {
      await noScript.context().close();
    }

    const testClass = await createTestClass(page, widestClassNames.className);
    const student = await newDevice(browser, locale);
    try {
      await signInAsTestStudent(
        student,
        testClass,
        widestClassNames.studentName,
      );
      const studentProfile = await openProfileMenu(student);
      await expect(studentProfile.locator('a[href="/guide"]')).toHaveCount(0);
      await expectMissingPage(student, "/guide", text.notFound);
    } finally {
      await student.context().close();
    }
  });

  test(`asks a visitor to sign in with a path back to the guide in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await page.goto("/guide");
    await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Fguide$/u);
  });
}
