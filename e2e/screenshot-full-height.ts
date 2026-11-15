import type { Page } from "@playwright/test";

/** A viewport as tall as the page puts fixed navigation at the foot of the whole screen, as the Peta references show it, so it does not hide the middle of a full-height capture. */
export async function screenshotFullHeight(
  page: Page,
  options: { path: string; scale?: "css" | "device" },
): Promise<void> {
  const viewport = page.viewportSize();
  if (viewport === null)
    throw new Error("A reference screenshot needs a viewport.");
  const position = await page.evaluate(() => ({
    scroll: window.scrollY,
    height: document.documentElement.scrollHeight,
  }));
  try {
    await page.setViewportSize({ ...viewport, height: position.height });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await page.screenshot({ ...options, fullPage: true });
  } finally {
    await page.setViewportSize(viewport);
    await page.evaluate((scroll) => {
      window.scrollTo(0, scroll);
    }, position.scroll);
  }
}
