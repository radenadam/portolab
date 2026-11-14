import type { BrowserContext, Page } from "@playwright/test";

export async function holdClientScripts(
  page: Page,
  otherDevice: BrowserContext,
  check: (loadClient: () => Promise<void>) => Promise<void>,
): Promise<void> {
  const started = Promise.withResolvers<undefined>();
  const scripts = Promise.withResolvers<undefined>();
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      started.resolve(undefined);
      await scripts.promise;
    }
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "commit" });
    await started.promise;
    await check(async () => {
      scripts.resolve(undefined);
      await page.waitForLoadState("load");
    });
  } finally {
    scripts.resolve(undefined);
    try {
      await page.unrouteAll({ behavior: "wait" });
    } finally {
      await otherDevice.close();
    }
  }
}
