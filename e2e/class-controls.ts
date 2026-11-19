import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { openClassSwitcher } from "./frame.ts";

/** The native popover is also the path that a browser without JavaScript uses to read the join address. */
export async function openJoinDetails(page: Page): Promise<Locator> {
  if (!(await page.locator("[data-class-join-details]:visible").isVisible())) {
    await page.locator("[data-join-code]:visible").click();
  }
  return page.locator("[popover]:popover-open");
}

/** The lecturer opens the calendar of a class from the switcher of the class in the top bar, which every screen of the class shows. */
export async function openCourseCalendar(page: Page): Promise<void> {
  const switcher = await openClassSwitcher(page);
  await switcher.locator('a[href$="/calendar"]').click();
  await expect(page).toHaveURL(/\/calendar$/);
}
