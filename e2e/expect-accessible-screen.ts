import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// The section "Interface behavior" of AGENTS.md sets this as the smallest touch target, and axe does not check it.
const smallestTargetHeight = 44;

/** Checks the screen with axe, and checks that every visible link, button, and form field is at least as high as the smallest touch target. */
export async function expectAccessibleScreen(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  // The styles size targets with the token in app/theme.css, so the token must hold the same height. The script is a string because the browser runs it.
  const tokenHeight: unknown = await page.evaluate(
    `(() => { const probe = document.createElement("div"); probe.style.height = "var(--size-touch-target)"; document.body.append(probe); const height = probe.getBoundingClientRect().height; probe.remove(); return height; })()`,
  );
  expect(tokenHeight).toBe(smallestTargetHeight);
  const smallTargets: string[] = [];
  const targets = page.locator(
    "a, button, input, select, textarea, [role=button]",
  );
  for (const target of await targets.all()) {
    const box = (await target.isVisible()) ? await target.boundingBox() : null;
    if (box !== null && box.height < smallestTargetHeight) {
      // The opening tag names any target, including a form field that has no text. The script is a string because the browser runs it.
      const openingTag: unknown = await target.evaluate(
        "(element) => element.outerHTML.slice(0, element.outerHTML.indexOf('>') + 1)",
      );
      smallTargets.push(
        `${String(openingTag)} is ${String(box.height)} pixels high.`,
      );
    }
  }
  expect(smallTargets).toEqual([]);
}
