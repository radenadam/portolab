import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function selectFirstStudent(page: Page): Promise<void> {
  await page.locator("main tbody tr").first().getByRole("link").click();
  await expect(page).toHaveURL(/student=\d+/);
  await expect(page.getByRole("dialog")).toBeVisible();
}
