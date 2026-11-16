import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectEndLabelsInsidePlot } from "./expect-end-labels-inside-plot.ts";

async function drawEndLabels(
  page: Page,
  position: number,
  withPlot = true,
): Promise<void> {
  await page.setContent(`
    <div ${withPlot ? "data-time-plot" : ""} style="width: 200px; height: 100px">
      <div><div>
        <svg width="200" height="100">
          <text data-time-label="end" x="${String(position)}" y="30">A</text>
          <text data-time-label="end" x="60" y="60">B</text>
        </svg>
      </div></div>
    </div>
  `);
}

test("checks end labels inside a namespaced SVG", async ({ page }) => {
  await drawEndLabels(page, 10);
  expect(
    await page.locator("svg").evaluate((element) => element.namespaceURI),
  ).toBe("http://www.w3.org/2000/svg");
  await expectEndLabelsInsidePlot(page, true);
});

for (const [edge, position] of [
  ["left", -20],
  ["right", 199],
] as const) {
  test(`rejects end labels beyond the ${edge} plot edge`, async ({ page }) => {
    await drawEndLabels(page, position);
    await expect(expectEndLabelsInsidePlot(page, true)).rejects.toThrow();
  });
}

test("names a missing plot container for visible end labels", async ({
  page,
}) => {
  await drawEndLabels(page, 10, false);
  await expect(expectEndLabelsInsidePlot(page, true)).rejects.toThrow(
    "A visible end label must have a time plot container.",
  );
});
