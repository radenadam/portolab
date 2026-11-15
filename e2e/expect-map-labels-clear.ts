import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Checks the drawing after font loading and resizing, because an estimated placement can pass while different font sizes move its rendered letters. */
export async function expectMapLabelsClear(map: Locator): Promise<void> {
  await expect
    .poll(() =>
      map.evaluate(async (element) => {
        await document.fonts.ready;
        const boxOf = (part: Element): DOMRect => {
          const ink = part.querySelector("tspan") ?? part;
          const rectangle = ink.getBoundingClientRect();
          const style = getComputedStyle(ink);
          const stroke =
            style.stroke === "none"
              ? 0
              : Number.parseFloat(style.strokeWidth) / 2;
          return new DOMRect(
            rectangle.x - stroke,
            rectangle.y - stroke,
            rectangle.width + 2 * stroke,
            rectangle.height + 2 * stroke,
          );
        };
        const labels = Array.from(element.querySelectorAll("text"))
          .filter(
            (label) =>
              getComputedStyle(label).visibility !== "hidden" &&
              label.getBoundingClientRect().width > 0,
          )
          .map((label) => ({
            name: label.textContent,
            fixed: label.getAttribute("data-map-label") !== "point",
            box: boxOf(label),
          }));
        const marks = Array.from(element.querySelectorAll("circle, path"))
          .filter((mark) => mark.getBoundingClientRect().width > 0)
          .map(boxOf);
        const overlaps = (first: DOMRect, second: DOMRect): boolean =>
          first.left < second.right &&
          second.left < first.right &&
          first.top < second.bottom &&
          second.top < first.bottom;
        const collisions: string[] = [];
        for (const [index, first] of labels.entries()) {
          for (const second of labels.slice(index + 1)) {
            if (overlaps(first.box, second.box)) {
              collisions.push(`${first.name} covers ${second.name}.`);
            }
          }
          if (first.fixed && marks.some((mark) => overlaps(first.box, mark))) {
            collisions.push(`${first.name} covers a point.`);
          }
        }
        return collisions;
      }),
    )
    .toEqual([]);
}
