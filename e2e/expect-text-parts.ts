import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Checks that an element shows a text whose parts the test knows, around parts that it cannot know in advance, such as the time of an order or of an update of prices. */
export async function expectTextParts(
  element: Locator,
  parts: readonly string[],
): Promise<void> {
  for (const part of parts) {
    await expect(element).toContainText(part);
  }
}
