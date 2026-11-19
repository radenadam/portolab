import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { tokenColor } from "./token-color.ts";

/** A checkbox is an element as large as a touch target, so a finger reaches it, and it draws a box at the size of the token of a checkbox in its middle, which fills with the color of data once the reader ticks it. The check leaves the checkbox as it found it. */
export async function expectCheckboxBox(checkbox: Locator): Promise<void> {
  const page = checkbox.page();
  const lengths = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    document.body.append(probe);
    const lengthOf = (token: string): number => {
      probe.style.width = `var(${token})`;
      return probe.getBoundingClientRect().width;
    };
    const result = {
      target: lengthOf("--size-touch-target"),
      box: lengthOf("--size-checkbox"),
    };
    probe.remove();
    return result;
  });
  const drawing = (): Promise<{
    width: number;
    height: number;
    boxWidth: number;
    boxHeight: number;
    fill: string;
  }> =>
    checkbox.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const box = getComputedStyle(element, "::before");
      return {
        width: bounds.width,
        height: bounds.height,
        boxWidth: Number.parseFloat(box.width),
        boxHeight: Number.parseFloat(box.height),
        fill: box.backgroundColor,
      };
    });
  const wasChecked = await checkbox.isChecked();
  await checkbox.uncheck();
  expect(await drawing()).toEqual({
    width: lengths.target,
    height: lengths.target,
    boxWidth: lengths.box,
    boxHeight: lengths.box,
    fill: await tokenColor(page, "--color-panel"),
  });
  await checkbox.check();
  expect((await drawing()).fill).toBe(await tokenColor(page, "--color-data"));
  if (!wasChecked) await checkbox.uncheck();
}
