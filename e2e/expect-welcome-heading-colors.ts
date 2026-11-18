import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function expectWelcomeHeadingColors(page: Page): Promise<void> {
  const headings = page.locator("#home-welcome-title, #home-price-guide h2");
  await expect(headings).toHaveCount(2);
  const problems = await headings.evaluateAll((elements) => {
    const probe = document.createElement("span");
    probe.style.color = "var(--color-ink)";
    document.body.append(probe);
    try {
      const expected = getComputedStyle(probe).color;
      const differences: string[] = [];
      for (const element of elements) {
        const color = getComputedStyle(element).color;
        const source = element.closest("[id]")?.id ?? element.tagName;
        if (color !== expected)
          differences.push(
            `${source} has color ${color}, but the ink token is ${expected}.`,
          );
      }
      return differences;
    } finally {
      probe.remove();
    }
  });
  expect(problems).toEqual([]);
}
