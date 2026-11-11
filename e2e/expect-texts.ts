import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Checks that an element shows each text, such as each notice of a page or each part of a text around parts that the test cannot know in advance, such as the time of an order or of an update of prices. */
export async function expectTexts(
  element: Locator,
  texts: readonly string[],
): Promise<void> {
  for (const text of texts) {
    await expect(element).toContainText(text);
  }
}
