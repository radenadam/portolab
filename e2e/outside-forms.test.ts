import { expect, test } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import {
  chosenPassword,
  joinAsNewStudent,
  signInAsNewLecturer,
  submitNewPassword,
  submitSignIn,
} from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { openClassAdministration } from "./class-controls.ts";
import { createTestClass } from "./create-test-class.ts";
import { isPhone } from "./frame.ts";
import { newDevice } from "./new-device.ts";
import { widestClassNames } from "./widest-class-names.ts";

const texts: Record<Locale, { create: string; reset: string }> = {
  id: { create: "Buat kelas", reset: "Atur ulang kata sandi" },
  en: { create: "Create the class", reset: "Reset the password" },
};

test.use({ javaScriptEnabled: false });

for (const locale of locales) {
  test(`keeps the visitor controls inside their targets before JavaScript loads in ${languageNames[locale]}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    const bounds = await page.getByRole("banner").evaluate((banner) => {
      const failures: string[] = [];
      let measured = 0;
      for (const control of banner.querySelectorAll("a, button")) {
        const box = control.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        measured += 1;
        const content = document.createRange();
        content.selectNodeContents(control);
        const words = content.getBoundingClientRect();
        if (words.left < box.left - 1 || words.right > box.right + 1) {
          failures.push(control.textContent.trim());
        }
      }
      return { measured, failures };
    });
    expect(bounds.measured).toBe(isPhone() ? 3 : 2);
    expect(bounds.failures).toEqual([]);
  });

  test(`creates a class, joins it, and resets a student password before JavaScript loads in ${languageNames[locale]}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, widestClassNames.lecturerName);
    await page.locator('main input[name="startingCash"]').fill("");
    await page
      .getByRole("main")
      .getByRole("button", { name: texts[locale].create })
      .click();
    for (const name of ["name", "firstSessionDate", "startingCash"]) {
      await expect(page.locator(`main input[name="${name}"]`)).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    }
    const testClass = await createTestClass(page, widestClassNames.className);
    const student = await newDevice(browser, locale, {
      javaScriptEnabled: false,
    });
    const username = await joinAsNewStudent(
      student,
      testClass.joinPath,
      widestClassNames.studentName,
    );
    await page.goto(testClass.path);
    await openClassAdministration(page);
    await page
      .locator("[data-class-administration]")
      .getByRole("link", { name: texts[locale].reset })
      .click();
    await page
      .getByRole("main")
      .getByRole("button", { name: texts[locale].reset })
      .click();
    const temporaryPassword = await page.locator("main p").nth(1).innerText();
    await student.goto("/account");
    await submitSignIn(student, username, temporaryPassword);
    await submitNewPassword(student, chosenPassword);
    await expect(student).toHaveURL("/account");
    await student.context().close();
  });
}
