import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Checks that a page has a title, which its tab shows and its first heading repeats, and each heading of its sections. */
export async function expectPageHeadings(
  page: Page,
  { title, headings }: { title: string; headings: readonly string[] },
): Promise<void> {
  await expect(page).toHaveTitle(`${title} | Portolab`);
  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
  for (const heading of headings) {
    await expect(
      page.getByRole("heading", { level: 2, name: heading, exact: true }),
    ).toBeVisible();
  }
}
