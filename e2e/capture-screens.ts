import type { Page, TestInfo } from "@playwright/test";

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
      if (screen.fullPage) {
        // The references show the whole page, so fixed frame parts need that height in the capture too.
        const height = await page.evaluate(
          () => document.documentElement.scrollHeight,
        );
        await page.setViewportSize({ width, height });
      }
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
