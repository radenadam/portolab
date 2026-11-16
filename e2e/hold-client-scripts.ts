import { expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

/** Opens an address, or reloads the page, with the scripts of the app held until the check loads them. It fails when the page reports an error meanwhile, which the screen does not show, such as React when the text that the browser renders differs from the text of the server. */
export async function holdClientScripts(
  page: Page,
  { otherDevice, address }: { otherDevice?: BrowserContext; address?: string },
  check: (loadClient: () => Promise<void>) => Promise<void>,
): Promise<void> {
  const started = Promise.withResolvers<undefined>();
  const scripts = Promise.withResolvers<undefined>();
  const pageErrors: string[] = [];
  const recordError = (error: Error): void => {
    pageErrors.push(error.message);
  };
  page.on("pageerror", recordError);
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      started.resolve(undefined);
      await scripts.promise;
    }
    await route.fallback();
  });
  try {
    if (address === undefined) await page.reload({ waitUntil: "commit" });
    else await page.goto(address, { waitUntil: "commit" });
    await started.promise;
    await check(async () => {
      scripts.resolve(undefined);
      await page.waitForLoadState("load");
    });
  } finally {
    page.off("pageerror", recordError);
    scripts.resolve(undefined);
    try {
      await page.unrouteAll({ behavior: "wait" });
    } finally {
      await otherDevice?.close();
    }
  }
  expect(pageErrors).toEqual([]);
}
