import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

/** Whether the test runs on the phone, whose screen has no room for the rail, so the frame shows the top bar and the tab bar of a phone, as decision 0028 sets. */
export function isPhone(): boolean {
  return test.info().project.name === "phone";
}

/** Opens a popover of the frame from the button that the screen shows for it, and returns the popover. */
async function openPopover(page: Page, id: string): Promise<Locator> {
  await page.locator(`button[popovertarget="${id}"]:visible`).click();
  const popover = page.locator(`#${id}`);
  await expect(popover).toBeVisible();
  return popover;
}

/** Opens the menu of the profile from the name in the top bar of a desktop or from the avatar of a phone, and returns it. */
export function openProfileMenu(page: Page): Promise<Locator> {
  return openPopover(page, "top-profile");
}

/** Opens the switch of the language that the top bar offers a person without the menu of a profile, such as a visitor, and returns it. */
export function openLanguageMenu(page: Page): Promise<Locator> {
  return openPopover(page, "language-menu");
}

/** Opens the switcher of the class in the top bar and returns its menu. */
export function openClassSwitcher(page: Page): Promise<Locator> {
  return openPopover(page, "class-switcher");
}

/** Opens the card of the badge of the simulation in the top bar and returns it. */
export function openSimulationCard(page: Page): Promise<Locator> {
  return openPopover(page, "simulation-card");
}
