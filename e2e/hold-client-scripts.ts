import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** A held script exposes the native state before hydration can replace it. */
export async function holdClientScripts(page: Page) {
  const scripts = Promise.withResolvers<undefined>();
  let heldScripts = 0;
  const heldCount = () => heldScripts;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      heldScripts += 1;
      await scripts.promise;
    }
    await route.continue();
  });
  return {
    heldCount,
    reloadNativePage: async () => {
      await page.reload({ waitUntil: "commit" });
      await expect.poll(heldCount).toBeGreaterThan(0);
      await expect(page.getByRole("slider")).toHaveCount(0);
    },
    release: () => {
      scripts.resolve(undefined);
    },
    dispose: async () => {
      scripts.resolve(undefined);
      await page.unrouteAll({ behavior: "wait" });
    },
  };
}
