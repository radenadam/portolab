import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Checks the rows apart from their help, because closed popovers stay in the DOM. */
export async function expectMeasureList(
  list: Locator,
  text: string,
): Promise<void> {
  await expect
    .poll(() =>
      list.evaluate((element) => {
        const copy = element.cloneNode(true);
        if (!(copy instanceof Element)) {
          throw new Error("The measure list is not an element.");
        }
        for (const help of copy.querySelectorAll("button, [popover]")) {
          help.remove();
        }
        return copy.textContent;
      }),
    )
    .toBe(text);
}
