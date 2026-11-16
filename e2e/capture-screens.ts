import type { Page, TestInfo } from "@playwright/test";
import { screenshotFullHeight } from "./screenshot-full-height.ts";
import { screenshotWidths } from "./screenshot-widths.ts";

export async function captureScreens(
  page: Page,
  testInfo: TestInfo,
  screen: {
    name: string;
    fullPage: boolean;
    fromTop: boolean;
    check?: () => Promise<void>;
  },
): Promise<void> {
  if (screen.fromTop) {
    // The frame leaves this corner clear of controls, so it clears chart focus even when a page hides its heading.
    await page.mouse.click(0, 0);
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  await page.mouse.move(0, 0);
  for (const width of screenshotWidths(testInfo)) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await screen.check?.();
      const path = testInfo.outputPath(
        `${screen.name}-${String(width)}-${colorScheme}.png`,
      );
      if (screen.fullPage)
        await screenshotFullHeight(page, { path, scale: "css" });
      else await page.screenshot({ path, scale: "css" });
    }
  }
}
