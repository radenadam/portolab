import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Checks that a page has a title, which its tab shows, its first heading, which repeats the title unless the header line of the page gives the heading apart from the class in its path, and each heading of its sections. */
export async function expectPageHeadings(
  page: Page,
  {
    title,
    heading = title,
    headings,
  }: { title: string; heading?: string; headings: readonly string[] },
): Promise<void> {
  await expect(page).toHaveTitle(`${title} | Portolab`);
  await expect(
    page.getByRole("heading", { level: 1, name: heading }),
  ).toBeVisible();
  for (const sectionHeading of headings) {
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: sectionHeading,
        exact: true,
      }),
    ).toBeVisible();
  }
}
