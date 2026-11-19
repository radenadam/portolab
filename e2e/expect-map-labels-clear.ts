import { expect } from "@playwright/test";
import type { Locator } from "@playwright/test";

/** Checks the drawing after font loading and resizing, because an estimated placement can pass while different font sizes move its rendered letters. A label of a chart never covers a mark, its own mark included, a line that the map marks with `data-map-line`, or another label, as the section "Interface text" of AGENTS.md sets. */
export async function expectMapLabelsClear(map: Locator): Promise<void> {
  await expect.poll(() => mapLabelProblems(map)).toEqual([]);
}

/** Lists each label of a drawing that covers another label, a mark, or a line of the map. */
async function mapLabelProblems(map: Locator): Promise<string[]> {
  return map.evaluate(async (element) => {
    await document.fonts.ready;
    // Playwright sends this function to the browser as its source, so it holds the helpers that it calls.
    const boxOf = (part: Element, withStroke: boolean): DOMRect => {
      const ink = part.querySelector("tspan") ?? part;
      const rectangle = ink.getBoundingClientRect();
      const style = getComputedStyle(ink);
      const stroke =
        withStroke && style.stroke !== "none"
          ? Number.parseFloat(style.strokeWidth) / 2
          : 0;
      return new DOMRect(
        rectangle.x - stroke,
        rectangle.y - stroke,
        rectangle.width + 2 * stroke,
        rectangle.height + 2 * stroke,
      );
    };
    const overlaps = (first: DOMRect, second: DOMRect): boolean =>
      first.left < second.right &&
      second.left < first.right &&
      first.top < second.bottom &&
      second.top < first.bottom;
    // A line crosses a box when a point on it lies inside the box by more than a pixel, which a point at every pixel of its length finds.
    const crosses = (
      box: DOMRect,
      segment: { x1: number; y1: number; x2: number; y2: number },
    ): boolean => {
      const steps = Math.ceil(
        Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1),
      );
      for (let step = 0; step <= steps; step += 1) {
        const share = steps === 0 ? 0 : step / steps;
        const across = segment.x1 + (segment.x2 - segment.x1) * share;
        const down = segment.y1 + (segment.y2 - segment.y1) * share;
        if (
          across > box.left + 1 &&
          across < box.right - 1 &&
          down > box.top + 1 &&
          down < box.bottom - 1
        )
          return true;
      }
      return false;
    };
    const segmentsOf = (
      line: SVGGraphicsElement,
    ): { x1: number; y1: number; x2: number; y2: number }[] => {
      const matrix = line.getScreenCTM();
      if (matrix === null) return [];
      const onScreen = (point: { x: number; y: number }): DOMPoint =>
        new DOMPoint(point.x, point.y).matrixTransform(matrix);
      if (line instanceof SVGLineElement) {
        const start = onScreen({
          x: line.x1.baseVal.value,
          y: line.y1.baseVal.value,
        });
        const end = onScreen({
          x: line.x2.baseVal.value,
          y: line.y2.baseVal.value,
        });
        return [{ x1: start.x, y1: start.y, x2: end.x, y2: end.y }];
      }
      if (!(line instanceof SVGPathElement)) return [];
      const length = line.getTotalLength();
      const points: DOMPoint[] = [];
      for (let index = 0; index <= 8; index += 1)
        points.push(onScreen(line.getPointAtLength((length * index) / 8)));
      return points.slice(1).map((point, index) => ({
        x1: points[index]?.x ?? point.x,
        y1: points[index]?.y ?? point.y,
        x2: point.x,
        y2: point.y,
      }));
    };
    const labels = Array.from(element.querySelectorAll("text"))
      .filter(
        (label) =>
          getComputedStyle(label).visibility !== "hidden" &&
          label.getBoundingClientRect().width > 0,
      )
      .map((label) => ({
        name: label.textContent,
        box: boxOf(label, true),
        ink: boxOf(label, false),
      }));
    const marks = Array.from(
      element.querySelectorAll("circle, path:not([data-map-line])"),
    )
      .filter((mark) => mark.getBoundingClientRect().width > 0)
      .map((mark) => boxOf(mark, true));
    const lines = Array.from(
      element.querySelectorAll<SVGGraphicsElement>("[data-map-line]"),
    ).flatMap(segmentsOf);
    const collisions: string[] = [];
    for (const [index, first] of labels.entries()) {
      for (const second of labels.slice(index + 1)) {
        if (overlaps(first.box, second.box)) {
          collisions.push(`${first.name} covers ${second.name}.`);
        }
      }
      if (marks.some((mark) => overlaps(first.box, mark))) {
        collisions.push(`${first.name} covers a point.`);
      }
      if (lines.some((line) => crosses(first.ink, line))) {
        collisions.push(`${first.name} covers a line.`);
      }
    }
    return collisions;
  });
}
