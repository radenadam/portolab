import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

export async function expectCompactChoice(choice: Locator): Promise<void> {
  const links = choice.getByRole("link");
  expect(await links.count()).toBeGreaterThan(1);
  await expect(links.first()).toBeVisible();
  const measurements = await links.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const range = document.createRange();
      range.selectNodeContents(element);
      return {
        width: element.getBoundingClientRect().width,
        ink: range.getBoundingClientRect().width,
        paddingStart: Number.parseFloat(style.paddingInlineStart),
        paddingEnd: Number.parseFloat(style.paddingInlineEnd),
        borders:
          Number.parseFloat(style.borderLeftWidth) +
          Number.parseFloat(style.borderRightWidth),
      };
    }),
  );
  for (const measured of measurements) {
    expect(measured.paddingStart).toBeGreaterThan(0);
    expect(measured.paddingEnd).toBeGreaterThan(0);
    const width =
      measured.ink +
      measured.paddingStart +
      measured.paddingEnd +
      measured.borders;
    expect(measured.width).toBeGreaterThanOrEqual(width - 1);
    expect(measured.width).toBeLessThanOrEqual(width + 1);
  }
}
