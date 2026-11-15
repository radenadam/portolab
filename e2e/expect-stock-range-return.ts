import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function expectStockRangeReturn(
  page: Page,
  {
    returnTo,
    range,
    month,
    back,
  }: {
    returnTo: string;
    range: string;
    month: string;
    back: string;
  },
): Promise<void> {
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("returnTo") === returnTo,
  );
  await page
    .getByRole("navigation", { name: range, exact: true })
    .getByRole("link", { name: month, exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("range") === "1m" &&
      url.searchParams.get("returnTo") === returnTo,
  );
  await page.getByRole("link", { name: back, exact: true }).click();
  await expect(page).toHaveURL(returnTo);
  const anchor = new URL(returnTo, page.url()).hash.slice(1);
  const target = page.locator(`#${anchor}`);
  await expect(target).toBeInViewport();
  const headerBottom = await page
    .getByRole("banner")
    .evaluate((banner) => banner.getBoundingClientRect().bottom);
  await expect
    .poll(() =>
      target.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeGreaterThanOrEqual(headerBottom);
}
