import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** A held script exposes the native state before hydration can replace it. */
export async function holdClientScripts(page: Page) {
  const scripts = Promise.withResolvers<undefined>();
  let count = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      count += 1;
      await scripts.promise;
    }
    await route.continue();
  });
  return {
    reloadNativePage: async () => {
      await page.reload({ waitUntil: "commit" });
      await expect.poll(() => count).toBeGreaterThan(0);
      await expect(page.getByRole("slider")).toHaveCount(0);
    },
    release: async () => {
      scripts.resolve(undefined);
      await page.waitForLoadState("load");
    },
    dispose: async () => {
      scripts.resolve(undefined);
      await page.unrouteAll({ behavior: "wait" });
    },
  };
}
