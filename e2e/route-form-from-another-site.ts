import type { Page } from "@playwright/test";
import { secondMilliseconds } from "../app/time-units.ts";

const formRequestTimeoutMilliseconds = 30 * secondMilliseconds;

export async function routeFormFromAnotherSite(
  page: Page,
  pattern: string,
): Promise<void> {
  await page.route(pattern, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      await route.fallback();
      return;
    }
    // Another port is another origin while keeping the cookies that a neighboring app on the same host can send.
    const otherOrigin = new URL(request.url());
    otherOrigin.port = String(Number(otherOrigin.port) + 1);
    const response = await route.fetch({
      headers: { ...request.headers(), origin: otherOrigin.origin },
      timeout: formRequestTimeoutMilliseconds,
    });
    await route.fulfill({ response });
  });
}
