import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";

/** A class that a test created, with the path of its page, the code that its lecturer shares, and the path that joins it on the site that the test opened. */
export interface TestClass {
  path: string;
  joinCode: string;
  joinPath: string;
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
  return readTestClass(page);
}

/** Reads a class from its page, which its lecturer opened. */
export async function readTestClass(page: Page): Promise<TestClass> {
  await expect(page).toHaveURL(/\/classes\/\d+$/);
  const joinCode = await page.locator("main dd").first().innerText();
  // The address that the page shows depends on the host that the lecturer opened, which the tests of that address check, so the other tests join at the path on the site that they opened.
  return {
    path: new URL(page.url()).pathname,
    joinCode,
    joinPath: `/join/${joinCode}`,
  };
}
