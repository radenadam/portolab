import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { layoutProblems } from "./expect-layout.ts";

export async function expectRefusedGlossarySearch(
  page: Page,
  query: string,
  region: Page | Locator = page,
): Promise<void> {
  const search = region.getByRole("searchbox");
  await search.fill(query);
  const submitted = page.waitForResponse(
    (answer) => answer.request().method() === "POST",
  );
  await search.press("Enter");
  expect((await submitted).status()).toBe(400);
  await expect(region.getByRole("alert")).toBeVisible();
  await expect(search).toHaveValue(query);
  expect(await layoutProblems(page)).toEqual([]);
}
