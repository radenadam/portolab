import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// The section "Interface behavior" of AGENTS.md sets this as the smallest touch target, and axe does not check it.
const smallestTargetHeight = 44;

/** Checks that every visible link, button, and form field on the page is at least 44 pixels high. */
export async function expectTouchTargets(page: Page): Promise<void> {
  const smallTargets: string[] = [];
  const targets = page.locator(
    "a, button, input, select, textarea, [role=button]",
  );
  for (const target of await targets.all()) {
    const box = (await target.isVisible()) ? await target.boundingBox() : null;
    if (box !== null && box.height < smallestTargetHeight) {
      const text = await target.innerText();
      smallTargets.push(`"${text}" is ${String(box.height)} pixels high.`);
    }
  }
  expect(smallTargets).toEqual([]);
}
