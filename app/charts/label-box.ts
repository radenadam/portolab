import type { PlotPosition } from "./plot";

/** The bounds of a label or mark in drawing text units, with the plot fraction that moves it when the plot grows. */
export interface LabelBox {
  at: PlotPosition;
  fixed: boolean;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** A fixed label of a server drawing must also clear the paths that names and marks take on a larger plot. */
export function boxesOverlap(
  first: LabelBox,
  second: LabelBox,
  canGrow = false,
): boolean {
  if (!canGrow || (!first.fixed && !second.fixed)) {
    return (
      first.left < second.right &&
      second.left < first.right &&
      first.top < second.bottom &&
      second.top < first.bottom
    );
  }
  return (
    canMeet(
      { start: first.left, end: first.right },
      { start: second.left, end: second.right },
      second.at.x - first.at.x,
    ) &&
    canMeet(
      { start: first.top, end: first.bottom },
      { start: second.top, end: second.bottom },
      second.at.y - first.at.y,
    )
  );
}

// Each edge moves linearly from its plot fraction as the plot grows, so its direction says whether two clear spans can meet at a larger size.
function canMeet(
  first: { start: number; end: number },
  second: { start: number; end: number },
  direction: number,
): boolean {
  if (direction > 0) return second.start < first.end;
  if (direction < 0) return second.end > first.start;
  return first.start < second.end && second.start < first.end;
}

export function distanceToBox(
  box: LabelBox,
  point: { x: number; y: number },
): number {
  return Math.hypot(
    Math.max(box.left - point.x, 0, point.x - box.right),
    Math.max(box.top - point.y, 0, point.y - box.bottom),
  );
}

/** Whether a box lies inside a plot of a size, with room to reach beyond its bottom and its left edge. */
export function contains(
  size: { width: number; height: number },
  box: LabelBox,
  room: { bottom: number; left: number },
): boolean {
  return (
    box.left >= -room.left &&
    box.right <= size.width &&
    box.top >= 0 &&
    box.bottom <= size.height + room.bottom
  );
}

// Two labels keep this gap, so that they never read as one.
const labelGap = { across: 0.67, down: 0.25 };

/** Whether a box comes nearer than the gap between labels to a label placed before it. */
export function hitsLabel(
  box: LabelBox,
  placedBoxes: readonly LabelBox[],
  canGrow: boolean,
): boolean {
  const spaced = {
    ...box,
    left: box.left - labelGap.across,
    right: box.right + labelGap.across,
    top: box.top - labelGap.down,
    bottom: box.bottom + labelGap.down,
  };
  return placedBoxes.some((other) => boxesOverlap(spaced, other, canGrow));
}
