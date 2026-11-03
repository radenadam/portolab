import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";

/** A class that a test created, with the path of its page and what its lecturer shares. */
export interface TestClass {
  path: string;
  joinCode: string;
  joinAddress: string;
}

/** Creates a class from the classes page of a lecturer who is signed in, and returns it from its page. The class has the most starting cash that Portolab accepts, so each screen that shows the amount is checked with its widest content. */
export async function createTestClass(
  page: Page,
  name: string,
): Promise<TestClass> {
  await page.goto("/classes");
  await page.locator('main input[name="name"]').fill(name);
  await page
    .locator('main input[name="startingCash"]')
    .fill(String(startingCashLimits.maximum));
  await page.locator("main form button[type=submit]").click();
  await expect(page).toHaveURL(/\/classes\/\d+$/);
  const shared = page.locator("main dd");
  return {
    path: new URL(page.url()).pathname,
    joinCode: await shared.nth(0).innerText(),
    joinAddress: await shared.nth(1).innerText(),
  };
}
