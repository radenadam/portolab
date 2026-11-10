import { pixels } from "~/units/pixels";
import type { Pixels } from "~/units/pixels";

export interface Position {
  x: Pixels;
  y: Pixels;
}

/** The text of the label of a point: the code of a stock, or a symbol of decision 0020 with its subscript, such as R with the subscript f. */
export interface PointLabel {
  text: string;
  subscript: string;
}

/** A label at the start of its baseline, with the name of its point. */
export interface PlacedLabel extends Position {
  name: string;
  label: PointLabel;
}

// IBM Plex Mono, the font of numbers that decision 0012 sets, sets the text of a chart, and each of its characters is 0.6 of the size of the text wide.
const characterWidth = 0.6;
/** How a chart draws a subscript against the size of its text: smaller, and lower than the baseline. */
export const subscriptStyle = { size: 0.75, shift: 0.3 };
// The box of a label reaches from the top of its letters to the bottom of its subscript.
const labelAscent = 0.9;
const labelHeight = 1.2;
const labelGap = 0.3;

/** The width of a text in the font of a chart, in sizes of its text. */
export function textWidth(text: string): number {
  return text.length * characterWidth;
}

interface Box {
  left: Pixels;
  top: Pixels;
  right: Pixels;
  bottom: Pixels;
}

/** Where labels may go: the area that holds them, and the straight line that a label avoids where it can. */
interface LabelRoom {
  area: Box;
  line: { start: Position; end: Position };
}

/** Places the label of each point that has one, in the order of the points, beside its point inside an area where it overlaps no mark of a labelled point and no label placed before it. Of those places, it takes the first that the line does not cross, or the first of all when the line crosses each of them. A label without such room is left out. */
export function placePointLabels(
  points: readonly (Position & {
    name: string;
    label: PointLabel | undefined;
    radius: Pixels;
  })[],
  room: LabelRoom,
  em: Pixels,
): PlacedLabel[] {
  const taken: Box[] = [];
  for (const point of points) {
    if (point.label !== undefined) {
      taken.push(boxAround(point));
    }
  }
  const labels: PlacedLabel[] = [];
  for (const point of points) {
    const { name, label } = point;
    if (label === undefined) {
      continue;
    }
    const free = labelBoxes(point, label, em).filter(
      (candidate) =>
        contains(room.area, candidate) &&
        !taken.some((other) => overlaps(candidate, other)),
    );
    const box =
      free.find((candidate) => !crosses(room.line, candidate)) ?? free[0];
    if (box !== undefined) {
      taken.push(box);
      labels.push({
        name,
        label,
        x: box.left,
        y: pixels(box.top + em * labelAscent),
      });
    }
  }
  return labels;
}

/** The boxes that a label can take beside its point, in the order of preference: to the right, to the left, above, and below. */
function labelBoxes(
  point: Position & { radius: Pixels },
  label: PointLabel,
  em: Pixels,
): Box[] {
  const width =
    em *
    (textWidth(label.text) + textWidth(label.subscript) * subscriptStyle.size);
  const height = em * labelHeight;
  const gap = point.radius + em * labelGap;
  const middle = point.y - height / 2;
  const center = point.x - width / 2;
  return [
    { left: point.x + gap, top: middle },
    { left: point.x - gap - width, top: middle },
    { left: center, top: point.y - gap - height },
    { left: center, top: point.y + gap },
  ].map(({ left, top }) => ({
    left: pixels(left),
    top: pixels(top),
    right: pixels(left + width),
    bottom: pixels(top + height),
  }));
}

function boxAround(point: Position & { radius: Pixels }): Box {
  return {
    left: pixels(point.x - point.radius),
    top: pixels(point.y - point.radius),
    right: pixels(point.x + point.radius),
    bottom: pixels(point.y + point.radius),
  };
}

function contains(outer: Box, inner: Box): boolean {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.top >= outer.top &&
    inner.bottom <= outer.bottom
  );
}

function overlaps(first: Box, second: Box): boolean {
  return (
    first.left < second.right &&
    second.left < first.right &&
    first.top < second.bottom &&
    second.top < first.bottom
  );
}

// A straight line crosses a box when its height at the left and the right edge of the box reaches into the height of the box. A line without width, which only a frame too small for its chart gives, crosses no box.
function crosses(line: LabelRoom["line"], box: Box): boolean {
  const width = line.end.x - line.start.x;
  if (width === 0) {
    return false;
  }
  const slope = (line.end.y - line.start.y) / width;
  const atLeft = line.start.y + (box.left - line.start.x) * slope;
  const atRight = line.start.y + (box.right - line.start.x) * slope;
  return (
    Math.min(atLeft, atRight) < box.bottom &&
    Math.max(atLeft, atRight) > box.top
  );
}
