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
