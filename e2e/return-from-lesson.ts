import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

export async function returnFromLesson(
  page: Page,
  {
    lesson,
    back,
    address,
    source,
  }: {
    lesson: string;
    back: string;
    address: string;
    source: Locator;
  },
): Promise<void> {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson);
  await page
    .getByRole("link", { name: back, exact: true })
    .click({ noWaitAfter: true });
  await expect(page).toHaveURL(address);
  await expect(source).toBeVisible();
  await expect(source).toBeInViewport();
}
