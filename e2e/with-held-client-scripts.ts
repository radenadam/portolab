import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function withHeldClientScripts<State>(
  page: Page,
  beforeLoad: () => Promise<State>,
  afterLoad: (state: State) => Promise<void>,
): Promise<void> {
  const scripts = Promise.withResolvers<undefined>();
  let heldScripts = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      heldScripts += 1;
      await scripts.promise;
    }
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "commit" });
    await expect.poll(() => heldScripts).toBeGreaterThan(0);
    const state = await beforeLoad();
    scripts.resolve(undefined);
    await page.waitForLoadState("load");
    await afterLoad(state);
  } finally {
    scripts.resolve(undefined);
    await page.unrouteAll({ behavior: "wait" });
  }
}
