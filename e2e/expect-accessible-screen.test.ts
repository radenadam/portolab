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
        button { box-sizing: border-box; min-height: 44px; cursor: pointer; }
        details { margin-top: 40px; }
        summary { min-height: 44px; cursor: pointer; }
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

const cursorCases = [
  {
    name: "accepts a hand on every kind of control and on the parts inside it, and ignores a waiting button and controls hidden in native details and popovers",
    extra: "",
    failure: undefined,
  },
  {
    name: "rejects a visible control that keeps the arrow",
    extra: '<button type="button" style="cursor: default">Arrow</button>',
    failure: "shows the cursor default.",
  },
  {
    name: "rejects a visible slider that keeps the arrow",
    extra: '<input type="range" aria-label="Arrow" style="cursor: default">',
    failure: "shows the cursor default.",
  },
  {
    name: "rejects a part that shows a hand but is not a control",
    extra: '<p style="cursor: pointer">Only informs</p>',
    failure: "shows a hand but is not a control.",
  },
] as const;

for (const { name, extra, failure } of cursorCases) {
  test(name, async ({ page }) => {
    await page.setContent(`<!doctype html>
      <html lang="en"><head><title>Cursors</title><style>
        :root { --size-touch-target: 44px; }
        body { background: white; color: black; }
        a, button, summary, label, select, input, [role="button"] { display: block; min-height: 44px; }
        input[type="checkbox"] { width: 44px; height: 44px; }
        :is(button, summary, select, [role="button"], label:has(> input), input:is([type="checkbox"], [type="radio"], [type="range"])):not(:disabled) { cursor: pointer; }
        button:disabled { cursor: progress; }
        .arrow { cursor: default; }
      </style></head><body><main><h1>Cursors</h1>
        <a href="#here">Link</a>
        <button type="button"><span>Part of a button</span></button>
        <button type="button" disabled>Waiting</button>
        <span role="button" tabindex="0">Drawn button</span>
        <label><input type="checkbox"> Choice</label>
        <select aria-label="Order"><option>Change</option></select>
        <input type="range" aria-label="Weight">
        <details><summary>More</summary><button type="button" class="arrow">Closed detail control</button></details>
        <div popover><button type="button" class="arrow">Closed popover control</button></div>
        ${extra}
      </main></body></html>`);
    if (failure === undefined) await expectAccessibleScreen(page);
    else await expect(expectAccessibleScreen(page)).rejects.toThrow(failure);
  });
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

const scrollCases = [
  {
    name: "accepts a capped list that keeps its gap from its scroll bar, a row of filters marked to scroll sideways, and a formula that is wider than its column",
    extra: "",
    failure: undefined,
  },
  {
    name: "rejects a box that scrolls sideways without the mark of a part that is meant to",
    extra:
      '<div tabindex="0" style="overflow: auto; width: 100px"><p style="width: 200px; margin: 0">Too wide</p></div>',
    failure: "scrolls sideways by 100 pixels.",
  },
  {
    name: "rejects a box that scrolls up and down with its text against its scroll bar",
    extra:
      '<div tabindex="0" style="overflow-y: auto; height: 40px; width: 120px"><p style="margin: 0; text-align: right">One</p><p style="margin: 0; text-align: right">Two</p><p style="margin: 0; text-align: right">Three</p></div>',
    failure: "pixels from the edge of its scroll bar.",
  },
] as const;

for (const { name, extra, failure } of scrollCases) {
  test(name, async ({ page }) => {
    await page.setContent(`<!doctype html>
      <html lang="en"><head><title>Scroll boxes</title><style>
        :root { --size-touch-target: 44px; }
        body { background: white; color: black; }
        .scroll-box { overflow: auto; padding-inline: 8px; height: 40px; width: 120px; }
        .filters { display: flex; gap: 8px; overflow-x: auto; width: 100px; }
        .filters span { flex: none; }
        .formula { display: inline-flex; overflow-x: auto; overflow-y: hidden; max-inline-size: 60px; }
      </style></head><body><main><h1>Scroll boxes</h1>
        <div class="scroll-box" tabindex="0"><p style="margin: 0; text-align: right">One</p><p style="margin: 0; text-align: right">Two</p><p style="margin: 0; text-align: right">Three</p></div>
        <div class="filters" tabindex="0" data-scrolls-sideways><span>All · 9</span><span>Waiting · 0</span><span>Filled · 6</span></div>
        <span class="formula" tabindex="0"><math><mi>x</mi><mo>=</mo><mn>1234567890123</mn></math></span>
        ${extra}
      </main></body></html>`);
    if (failure === undefined) await expectAccessibleScreen(page);
    else await expect(expectAccessibleScreen(page)).rejects.toThrow(failure);
  });
}
