import type { TestInfo } from "@playwright/test";

/** The phone project preserves touch input while desktop covers both reference widths. */
export function screenshotWidths(testInfo: TestInfo): readonly number[] {
  return testInfo.project.name === "phone" ? [360] : [1440, 1920];
}
