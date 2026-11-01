import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import type { Locale } from "../app/paraglide/runtime.js";

/** Chooses a language with the switch on the home page, so a test can check the text of the next page in that language. */
export async function chooseLanguage(
  page: Page,
  locale: Locale,
): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: languageNames[locale] }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
}
