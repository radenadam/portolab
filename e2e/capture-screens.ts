import type { Page, TestInfo } from "@playwright/test";
import { screenshotFullHeight } from "./screenshot-full-height.ts";

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
    await page.getByRole("heading", { level: 1 }).click();
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  }
  await page.mouse.move(0, 0);
  const widths = testInfo.project.name === "phone" ? [360] : [1440, 1920];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await screen.check?.();
      const path = testInfo.outputPath(
        `${screen.name}-${String(width)}-${colorScheme}.png`,
      );
      if (screen.fullPage) await screenshotFullHeight(page, { path });
      else await page.screenshot({ path, scale: "css" });
    }
  }
}
