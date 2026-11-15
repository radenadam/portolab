import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectDefinitionTerms } from "./expect-definition-terms.ts";
import { sidewaysProblems } from "./expect-layout.ts";

// The section "Interface behavior" of AGENTS.md sets this as the smallest touch target, and axe does not check it.
const smallestTargetHeight = 44;

const colorSchemes = ["light", "dark"] as const;

/** Checks the screen with axe in the light and the dark theme, checks that every visible link, button, and form field is at least as high as the smallest touch target, and checks that the page does not scroll sideways. */
export async function expectAccessibleScreen(page: Page): Promise<void> {
  await expectDefinitionTerms(page);
  // Until the fonts load, the browser draws text in a fallback font, whose widths differ.
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const startColorScheme = await page.evaluate(() =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  // Each theme has its own colors, so axe checks the contrast of each.
  for (const colorScheme of colorSchemes) {
    await page.emulateMedia({ colorScheme });
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations,
      `Axe found violations in the ${colorScheme} theme.`,
    ).toEqual([]);
  }
  // A caller may test more of the page after this check, and it expects the theme that it chose.
  await page.emulateMedia({ colorScheme: startColorScheme });
  // The styles size targets with the token in app/theme.css, so the token must hold the same height.
  const tokenHeight = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.height = "var(--size-touch-target)";
    document.body.append(probe);
    const height = probe.getBoundingClientRect().height;
    probe.remove();
    return height;
  });
  expect(tokenHeight).toBe(smallestTargetHeight);
  const targets = page.locator(
    "a, button, input, select, textarea, [role=button]",
  );
  // One browser call keeps pages with many closed concept cards within the test deadline.
  const smallTargets = await targets
    .filter({ visible: true })
    .evaluateAll((elements, minimum) => {
      const undersized: string[] = [];
      for (const element of elements) {
        const box = element.getBoundingClientRect();
        if (box.height < minimum) {
          // The opening tag names any target, including a form field that has no text.
          const openingTag = element.outerHTML.slice(
            0,
            element.outerHTML.indexOf(">") + 1,
          );
          undersized.push(
            `${openingTag} is ${String(box.height)} pixels high.`,
          );
        }
      }
      return undersized;
    }, smallestTargetHeight);
  expect(smallTargets).toEqual([]);
  // Axe does not check the width of the page.
  expect(await sidewaysProblems(page)).toEqual([]);
}
