import { expect, type Page } from "@playwright/test";
import { secondMilliseconds } from "../app/time-units.ts";

/** A held client script can postpone the load event, so measurements wait for styles and fonts themselves. */
export async function waitForPageStyles(page: Page): Promise<void> {
  // Node polls so the check does not depend on page timers.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const pending: string[] = [];
          if (document.readyState === "loading")
            pending.push(`${document.URL} (${document.readyState})`);
          for (const link of document.querySelectorAll<HTMLLinkElement>(
            'link[rel~="stylesheet"]',
          )) {
            if (link.sheet === null) pending.push(link.href);
          }
          return pending;
        }),
      {
        timeout: 10 * secondMilliseconds,
        message: "The page must finish parsing and load its stylesheets.",
      },
    )
    .toEqual([]);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}
