import type { Page, TestInfo } from "@playwright/test";
import { screenshotWidths } from "./screenshot-widths.ts";

export async function captureScreens(
  page: Page,
  testInfo: TestInfo,
  screen: {
    name: string;
    fullPage: boolean;
    fromTop: boolean;
    beforeCapture?: () => Promise<void>;
  },
): Promise<void> {
  if (screen.fromTop) {
    await page.getByRole("heading", { level: 1 }).click();
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  await page.mouse.move(0, 0);
  for (const width of screenshotWidths(testInfo)) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      if (screen.fullPage) {
        // The references show the whole page, so fixed frame parts need that height in the capture too.
        const height = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        await page.setViewportSize({ width, height });
      }
      await screen.beforeCapture?.();
      await page.screenshot({
        path: testInfo.outputPath(
          `${screen.name}-${String(width)}-${colorScheme}.png`,
        ),
        fullPage: screen.fullPage,
        scale: "css",
      });
      await page.setViewportSize({ width, height: 900 });
    }
  }
}
