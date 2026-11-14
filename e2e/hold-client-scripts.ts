import type { Page } from "@playwright/test";

export async function holdClientScripts(page: Page) {
  const scripts = Promise.withResolvers<undefined>();
  let heldScripts = 0;
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "script") {
      heldScripts += 1;
      await scripts.promise;
    }
    await route.continue();
  });
  return {
    heldCount: () => heldScripts,
    release: () => {
      scripts.resolve(undefined);
    },
    dispose: async () => {
      scripts.resolve(undefined);
      await page.unrouteAll({ behavior: "wait" });
    },
  };
}
