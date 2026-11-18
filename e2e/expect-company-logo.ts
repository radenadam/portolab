import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { tokenColor } from "./token-color.ts";
import { companyLogoPixels } from "../app/features/market-data/company-logo-format.ts";
import { companyLogoPaddingPixels } from "../app/features/market-data/company-logo-for-test.ts";
import type { CompanyLogoShape } from "../app/features/market-data/company-logo-for-test.ts";

// Peta gives the small, default, and large tiles their own corners.
const tileRadii = new Map([
  [26, 7],
  [32, 9],
  [44, 12],
]);

/** Measuring the rendered ink catches an image that exists but shrinks inside its tile. */
export async function expectCompanyLogo(
  image: Locator,
  shape: CompanyLogoShape,
): Promise<void> {
  await expect
    .poll(() =>
      image.evaluate(
        (element) =>
          element instanceof HTMLImageElement &&
          element.complete &&
          element.naturalWidth > 0,
      ),
    )
    .toBe(true);
  await image.evaluate(async (element) => {
    if (!(element instanceof HTMLImageElement))
      throw new Error("The logo is not an image.");
    await element.decode();
    element.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "instant",
    });
  });
  const tile = image.locator("..");
  await expect(tile).toHaveCSS(
    "background-color",
    await tokenColor(image.page(), "--color-logo-ground"),
  );
  const baselines = await tile.evaluate((element) => {
    const parent = element.parentElement;
    if (parent === null) throw new Error("The tile has no parent.");
    const positions: number[] = [];
    for (const monogram of [false, true]) {
      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:fixed;visibility:hidden;display:flex;align-items:baseline";
      wrapper.setAttribute("aria-hidden", "true");
      const copy = element.cloneNode(true);
      if (!(copy instanceof HTMLElement))
        throw new Error("The tile clone is not an element.");
      if (monogram) copy.textContent = "BB";
      const probe = document.createElement("span");
      probe.textContent = "x";
      wrapper.append(copy, probe);
      parent.append(wrapper);
      try {
        positions.push(
          probe.getBoundingClientRect().top -
            wrapper.getBoundingClientRect().top,
        );
      } finally {
        wrapper.remove();
      }
    }
    return positions;
  });
  expect(baselines[0]).toBeCloseTo(baselines[1] ?? Number.NaN, 1);
  const screenshot = await tile.screenshot({ scale: "css" });
  const box = await tile.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      width: bounds.width,
      height: bounds.height,
      border: Number.parseFloat(style.borderLeftWidth),
      radius: Number.parseFloat(style.borderTopLeftRadius),
    };
  });
  expect(box.height).toBeCloseTo(box.width, 2);
  const expectedRadius = tileRadii.get(box.width);
  expect(expectedRadius).toBeDefined();
  expect(box.radius).toBe(expectedRadius);
  const drawing = await image.boundingBox();
  if (drawing === null) throw new Error("The logo image is not visible.");
  expect(drawing.width).toBeCloseTo(box.width - box.border * 2, 2);
  expect(drawing.height).toBeCloseTo(box.height - box.border * 2, 2);
  const ink = await image.page().evaluate(
    async ({ uri, border, radius }) => {
      const picture = new Image();
      picture.src = uri;
      await picture.decode();
      const canvas = document.createElement("canvas");
      canvas.width = picture.width;
      canvas.height = picture.height;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("The tile test needs a canvas.");
      context.drawImage(picture, 0, 0);
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      let left = canvas.width;
      let right = -1;
      let top = canvas.height;
      let bottom = -1;
      const edge = Math.ceil(border) + 1;
      const innerRadius = Math.max(0, radius - border - 1);
      const inside = (column: number, row: number): boolean => {
        const centerColumn = Math.min(
          Math.max(column, edge + innerRadius),
          canvas.width - edge - innerRadius,
        );
        const centerRow = Math.min(
          Math.max(row, edge + innerRadius),
          canvas.height - edge - innerRadius,
        );
        return (
          (column - centerColumn) ** 2 + (row - centerRow) ** 2 <=
          innerRadius ** 2
        );
      };
      for (let row = edge; row < canvas.height - edge; row++) {
        for (let column = edge; column < canvas.width - edge; column++) {
          if (!inside(column + 0.5, row + 0.5)) continue;
          const offset = (row * canvas.width + column) * 4;
          // The prototype counts a faint antialiased tip as ink as well.
          const away = Math.max(
            255 - (pixels[offset] ?? 255),
            255 - (pixels[offset + 1] ?? 255),
            255 - (pixels[offset + 2] ?? 255),
          );
          if (away > 24) {
            left = Math.min(left, column);
            right = Math.max(right, column);
            top = Math.min(top, row);
            bottom = Math.max(bottom, row);
          }
        }
      }
      return { width: right - left + 1, height: bottom - top + 1 };
    },
    {
      uri: `data:image/png;base64,${screenshot.toString("base64")}`,
      border: box.border,
      radius: box.radius,
    },
  );
  const padding = companyLogoPaddingPixels[shape] / companyLogoPixels;
  const reach = shape === "wide" ? ink.width : Math.max(ink.width, ink.height);
  expect(reach).toBeGreaterThanOrEqual(
    (box.width - box.border * 2) * (1 - 2 * padding) - 1,
  );
}
