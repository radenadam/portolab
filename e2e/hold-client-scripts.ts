import type { BrowserContext, Page } from "@playwright/test";

export async function holdClientScripts(
  page: Page,
  { otherDevice, address }: { otherDevice?: BrowserContext; address?: string },
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
    if (address === undefined) await page.reload({ waitUntil: "commit" });
    else await page.goto(address, { waitUntil: "commit" });
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
      await otherDevice?.close();
    }
  }
}
