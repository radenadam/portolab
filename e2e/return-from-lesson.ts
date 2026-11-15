import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function returnFromLesson(
  page: Page,
  {
    lesson,
    back,
    address,
  }: {
    lesson: string;
    back: string;
    address: string;
  },
): Promise<void> {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson);
  await page
    .getByRole("link", { name: back, exact: true })
    .click({ noWaitAfter: true });
  await expect(page).toHaveURL(address);
}
