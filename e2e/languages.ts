import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** The languages of Portolab, by the code that a page declares and the name that the language switch shows. */
export const languages = [
  { code: "id", name: "Bahasa Indonesia" },
  { code: "en", name: "English" },
] as const;

export type Language = (typeof languages)[number];

/** Chooses a language with the switch on the home page, so a test can check the text of the next page in that language. */
export async function chooseLanguage(
  page: Page,
  language: Language,
): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: language.name }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", language.code);
}

/** The expected text of a screen in each language, so a test runs the same checks in each. */
export type TextsByLanguage<Texts> = Record<Language["code"], Texts>;
