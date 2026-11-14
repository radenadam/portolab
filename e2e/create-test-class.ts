import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { joinPath } from "../app/features/classes/join-code.ts";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { parseRecordId } from "../app/value-parsers.ts";
import { wibDateOf } from "../app/wib.ts";
import type { Rupiah } from "../app/units/rupiah.ts";

/** A class that a test created, with its id, the path of its page, the code that its lecturer shares, and the path that joins it on the site that the test opened. */
export interface TestClass {
  id: ClassId;
  path: string;
  joinCode: string;
  joinPath: string;
}

/** Unless a test supplies its own cash, the class starts with the most Portolab accepts, so each screen is checked with its widest content. Its session 1 meets today. */
export async function createTestClass(
  page: Page,
  name: string,
  startingCash: Rupiah = startingCashLimits.maximum,
): Promise<TestClass> {
  await page.goto("/classes");
  await page.locator('main input[name="name"]').fill(name);
  await page
    .locator('main input[name="firstSessionDate"]')
    .fill(wibDateOf(new Date()));
  await page
    .locator('main input[name="startingCash"]')
    .fill(String(startingCash));
  await page.locator("main form button[type=submit]").click();
  return readTestClass(page);
}

/** Reads a class from its page, which its lecturer opened. */
export async function readTestClass(page: Page): Promise<TestClass> {
  await expect(page).toHaveURL(/\/classes\/\d+$/);
  const joinCode = await page.locator("main dd").first().innerText();
  // The address that the page shows depends on the host that the lecturer opened, which the tests of that address check, so the other tests join at the path on the site that they opened.
  const path = new URL(page.url()).pathname;
  return {
    id: successValueForTest(
      parseRecordId<ClassId>(path.split("/").at(-1), "classId"),
      "The address of the class ends in its id",
    ),
    path,
    joinCode,
    joinPath: joinPath(joinCode),
  };
}
