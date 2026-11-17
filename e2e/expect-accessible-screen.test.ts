import { expect, test } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";

for (const short of [false, true]) {
  test(
    short
      ? "rejects a visible touch target below the theme minimum"
      : "accepts full touch targets and ignores controls hidden in native details and popovers",
    async ({ page }) => {
      await page.setContent(`<!doctype html>
      <html lang="en"><head><title>Touch targets</title><style>
        :root { --size-touch-target: 44px; }
        body { background: white; color: black; }
        button { box-sizing: border-box; min-height: 44px; }
        details { margin-top: 40px; }
        summary { min-height: 44px; }
        .short { min-height: 0; height: 20px; }
      </style></head><body><main><h1>Touch targets</h1>
        <button type="button" class="${short ? "short" : "full"}">Visible target</button>
        <button type="button" class="short" hidden>Hidden target</button>
        <details><summary>More targets</summary><button type="button" class="short">Closed detail target</button></details>
        <div popover><button type="button" class="short">Closed popover target</button></div>
      </main></body></html>`);
      if (short)
        await expect(expectAccessibleScreen(page)).rejects.toThrow(
          "20 pixels high",
        );
      else await expectAccessibleScreen(page);
    },
  );
}

for (const [theme, colorScheme] of [
  ["light", "dark"],
  ["dark", "light"],
] as const) {
  test(`rejects a contrast defect with ${theme} chosen on a ${colorScheme} device and restores the reader's choice`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.setContent(`<!doctype html><html lang="en" data-theme="light"><head><title>Contrast</title><style>
      :root { --size-touch-target: 44px; }
      body { color: black; background: white; }
      @media (prefers-color-scheme: ${colorScheme}) {
        html[data-theme="${theme}"] p { color: #eeeeee; }
      }
      </style></head><body><main><h1>Contrast</h1><p>A theme-specific contrast defect.</p></main></body></html>`);
    await page.emulateMedia({ colorScheme });
    await page.locator("html").evaluate((element, choice) => {
      element.setAttribute("data-theme", choice);
    }, theme);
    await expect(page.locator("p")).toHaveCSS("color", "rgb(238, 238, 238)");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.locator("html").evaluate((element) => {
      element.setAttribute("data-theme", "light");
    });
    // Axe reports identical foreground and background colors as incomplete, so the fixture uses distinct colors with insufficient contrast.
    await expect(expectAccessibleScreen(page)).rejects.toThrow(
      `Axe found violations with ${theme} chosen on a ${colorScheme} device.`,
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(
      await page.evaluate(
        () => matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    ).toBe(true);
  });
}
