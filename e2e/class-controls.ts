import type { Locator, Page } from "@playwright/test";

/** The native popover is also the path that a browser without JavaScript uses to read the join address. */
export async function openJoinDetails(page: Page): Promise<Locator> {
  if (!(await page.locator("[data-class-join-details]:visible").isVisible())) {
    await page.locator("[data-join-code]:visible").click();
  }
  return page.locator("[popover]:popover-open");
}

/** Administration stays outside the visual summary, so these flows must open it explicitly. */
export async function openClassAdministration(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  const details = page.locator("[data-class-administration]");
  if ((await details.getAttribute("open")) === null) {
    await details.locator("summary").click();
  }
}
