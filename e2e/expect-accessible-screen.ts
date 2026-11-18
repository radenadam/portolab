import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectDefinitionTerms } from "./expect-definition-terms.ts";
import { sidewaysProblems } from "./expect-layout.ts";
import { waitForPageStyles } from "./wait-for-page-styles.ts";

// The section "Interface behavior" of AGENTS.md sets this as the smallest touch target, and axe does not check it.
const smallestTargetHeight = 44;

const themeCases = [
  { theme: "light", colorScheme: "dark" },
  { theme: "dark", colorScheme: "light" },
] as const;

/** Axe runs page scripts, so callers keep JavaScript enabled. holdClientScripts can pause the app's scripts while axe checks server HTML. */
export async function expectAccessibleScreen(page: Page): Promise<void> {
  await waitForPageStyles(page);
  await expectDefinitionTerms(page);
  const startColorScheme = await page.evaluate(() =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  );
  const startTheme = await page.locator("html").getAttribute("data-theme");
  try {
    for (const { theme, colorScheme } of themeCases) {
      await page.emulateMedia({ colorScheme });
      await page.locator("html").evaluate((element, choice) => {
        element.setAttribute("data-theme", choice);
      }, theme);
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        `Axe found violations with ${theme} chosen on a ${colorScheme} device.`,
      ).toEqual([]);
    }
  } finally {
    await page.locator("html").evaluate((element, theme) => {
      if (theme === null) element.removeAttribute("data-theme");
      else element.setAttribute("data-theme", theme);
    }, startTheme);
    await page.emulateMedia({ colorScheme: startColorScheme });
  }
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
