import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function expectEndLabelsInsidePlot(
  page: Page,
  required: boolean,
): Promise<void> {
  const labels = page.locator('[data-time-label="end"]');
  if (required) await expect(labels).toHaveCount(2);
  for (const label of await labels.all()) {
    if (!(await label.isVisible())) continue;
    const bounds = await label.evaluate((element) => {
      const plot = element.closest("[data-time-plot]");
      if (plot === null) return undefined;
      const ink = element.getBoundingClientRect();
      const container = plot.getBoundingClientRect();
      return {
        inkStart: ink.left,
        inkEnd: ink.right,
        plotStart: container.left,
        plotEnd: container.right,
      };
    });
    if (bounds === undefined)
      throw new Error("A visible end label must have a time plot container.");
    expect(bounds.inkStart).toBeGreaterThanOrEqual(bounds.plotStart);
    expect(bounds.inkEnd).toBeLessThanOrEqual(bounds.plotEnd);
  }
}
