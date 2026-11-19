import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Opens the page of the first student of Mahasiswa, to which the whole row of the student links. */
export async function openFirstStudent(page: Page): Promise<void> {
  await page.locator("main tbody tr").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/students\/\d+\?returnTo=/);
}
