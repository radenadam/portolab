import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectDefinitionTerms } from "./expect-definition-terms.ts";
import { sidewaysProblems } from "./expect-layout.ts";
import { styleOrderProblems } from "./style-order-problems.ts";
import { waitForPageStyles } from "./wait-for-page-styles.ts";

// The section "Interface behavior" of AGENTS.md sets this as the smallest touch target, and axe does not check it.
const smallestTargetHeight = 44;
// The gap that the global class .scroll-box of app/theme.css keeps between the content of a box that scrolls and its scroll bar.
const scrollBarGap = 8;

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
  expect(await cursorProblems(page)).toEqual([]);
  expect(await scrollProblems(page)).toEqual([]);
  // Axe does not check the width of the page.
  expect(await sidewaysProblems(page)).toEqual([]);
  expect(await styleOrderProblems(page)).toEqual([]);
}

/** The section "Interface behavior" of AGENTS.md asks every control to turn the pointer into a hand and nothing that only informs to look clickable, which axe does not check. This lists every visible control that shows another cursor, and every other part that shows a hand outside a control. */
async function cursorProblems(page: Page): Promise<string[]> {
  return page.locator("body").evaluate((body) => {
    const controls =
      "a[href], button:not(:disabled), summary, select:not(:disabled), label:has(> input), [role=button], input:is([type=checkbox], [type=radio], [type=range]):not(:disabled)";
    const problems: string[] = [];
    for (const element of body.querySelectorAll("*")) {
      if (!element.checkVisibility({ visibilityProperty: true })) continue;
      const cursor = getComputedStyle(element).cursor;
      const isControl = element.matches(controls);
      const openingTag = element.outerHTML.slice(
        0,
        element.outerHTML.indexOf(">") + 1,
      );
      if (isControl && cursor !== "pointer")
        problems.push(`${openingTag} shows the cursor ${cursor}.`);
      if (
        !isControl &&
        cursor === "pointer" &&
        element.closest(controls) === null
      )
        problems.push(`${openingTag} shows a hand but is not a control.`);
    }
    return problems;
  });
}

/** The section "Interface behavior" of AGENTS.md asks a box that scrolls to keep its scroll bar off its content, and nothing to scroll sideways where its content can fit or wrap, which axe does not check. This lists every visible box that scrolls sideways without the mark `data-scrolls-sideways` of a part that is meant to, such as a row of filters on a phone, apart from a formula, and every box that scrolls up and down whose text comes nearer to the edge of its scroll bar than the gap of a scroll box. */
async function scrollProblems(page: Page): Promise<string[]> {
  return page.locator("body").evaluate((body, gap) => {
    // Playwright sends this function to the browser as its source, so it holds the helpers that it calls.
    const scrollsBy = (overflow: string, by: number): number =>
      (overflow === "auto" || overflow === "scroll") && by > 1 ? by : 0;
    const textRoom = (element: Element): number => {
      const box = element.getBoundingClientRect();
      const barEdge = box.left + element.clientLeft + element.clientWidth;
      let textEnd = Number.NEGATIVE_INFINITY;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if ((node.textContent ?? "").trim() === "") continue;
        range.selectNodeContents(node);
        for (const rectangle of range.getClientRects())
          textEnd = Math.max(textEnd, rectangle.right);
      }
      return barEdge - textEnd;
    };
    // A formula shrinks before it scrolls, so one that still scrolls sideways is wider than its column at its smallest size, as decision 0070 allows.
    const mayScrollSideways = (element: Element): boolean =>
      element.querySelector(":scope > math") !== null ||
      element.closest("[data-scrolls-sideways]") !== null;
    const problems: string[] = [];
    for (const element of body.querySelectorAll("*")) {
      if (!element.checkVisibility({ visibilityProperty: true })) continue;
      const style = getComputedStyle(element);
      const sideways = scrollsBy(
        style.overflowX,
        element.scrollWidth - element.clientWidth,
      );
      const upAndDown = scrollsBy(
        style.overflowY,
        element.scrollHeight - element.clientHeight,
      );
      const openingTag = element.outerHTML.slice(
        0,
        element.outerHTML.indexOf(">") + 1,
      );
      if (sideways > 0 && !mayScrollSideways(element))
        problems.push(
          `${openingTag} scrolls sideways by ${String(sideways)} pixels.`,
        );
      const room = upAndDown > 0 ? textRoom(element) : gap;
      if (room < gap - 0.5)
        problems.push(
          `${openingTag} holds text ${String(Math.round(room))} pixels from the edge of its scroll bar.`,
        );
    }
    return problems;
  }, scrollBarGap);
}
