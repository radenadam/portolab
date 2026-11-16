import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectCompactChoice } from "./expect-compact-choice.ts";

async function drawChoice(
  page: Page,
  { padding = 12, stretch = false, empty = false } = {},
): Promise<void> {
  await page.setContent(`
    <style>
      nav {
        display: inline-grid;
        grid-auto-flow: column;
        grid-auto-columns: ${stretch ? "1fr" : "auto"};
        ${stretch ? "width: 300px;" : ""}
      }
      a { padding-inline: ${String(padding)}px; }
    </style>
    <nav id="choice">${empty ? "" : '<a href="#a">A</a><a href="#b">BBBB</a>'}</nav>
  `);
}

test("accepts compact choices with padded intrinsic links", async ({
  page,
}) => {
  await drawChoice(page);
  await expectCompactChoice(page.locator("#choice"));
});

test("rejects compact choices without inline padding", async ({ page }) => {
  await drawChoice(page, { padding: 0 });
  await expect(expectCompactChoice(page.locator("#choice"))).rejects.toThrow();
});

test("rejects compact choices with stretched links", async ({ page }) => {
  await drawChoice(page, { stretch: true });
  await expect(expectCompactChoice(page.locator("#choice"))).rejects.toThrow();
});

test("rejects compact choices without links", async ({ page }) => {
  await drawChoice(page, { empty: true });
  await expect(expectCompactChoice(page.locator("#choice"))).rejects.toThrow();
});
