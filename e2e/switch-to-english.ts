import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Chooses English with the language switch on the home page, so a test can check the English text of the next page. */
export async function switchToEnglish(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
}
