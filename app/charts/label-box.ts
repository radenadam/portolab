import type { PlotPosition } from "./plot";
import { labelAscent, labelDescent } from "./label-places";
import type { LabelPlace } from "./map-labels";

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

/** A straight line of a drawing between two positions of its plot, such as the security market line or the stem of a point. */
export interface LabelledLine {
  start: PlotPosition;
  end: PlotPosition;
}

/** Whether a line of a plot of a size crosses a box, so that a label in the box would cover the line. */
export function crossesLine(
  box: LabelBox,
  line: LabelledLine,
  size: { width: number; height: number },
): boolean {
  const start = { x: line.start.x * size.width, y: line.start.y * size.height };
  const end = { x: line.end.x * size.width, y: line.end.y * size.height };
  // Liang and Barsky clip the line to the box: the part of the line between the parameters that stay inside every edge is inside the box.
  const across = end.x - start.x;
  const down = end.y - start.y;
  let enter = 0;
  let leave = 1;
  for (const [step, room] of [
    [-across, start.x - box.left],
    [across, box.right - start.x],
    [-down, start.y - box.top],
    [down, box.bottom - start.y],
  ] as const) {
    if (step === 0) {
      if (room <= 0) return false;
      continue;
    }
    const at = room / step;
    if (step < 0) enter = Math.max(enter, at);
    else leave = Math.min(leave, at);
    if (enter >= leave) return false;
  }
  return true;
}

// A label keeps a little room from a mark.
export const markRoom = 0.08;

/** The center of a mark in a plot of a size, in sizes of the text of the labels. */
export function centerOf(
  mark: { position: PlotPosition },
  size: { width: number; height: number },
): { x: number; y: number } {
  return { x: mark.position.x * size.width, y: mark.position.y * size.height };
}

/** The box that a mark of a radius fills in a plot of a size, with the room that a label keeps from it. */
export function boxAround(
  mark: { position: PlotPosition; outerRadius: number },
  size: { width: number; height: number },
  outerRadius = mark.outerRadius,
): LabelBox {
  const center = centerOf(mark, size);
  const radius = outerRadius + markRoom;
  return {
    at: mark.position,
    fixed: false,
    left: center.x - radius,
    right: center.x + radius,
    top: center.y - radius,
    bottom: center.y + radius,
  };
}

// The outline and the small overhang beyond SVG text advances need room at every edge.
export const labelOutlineRoom = 0.25;

/** The box of the letters of a label, without the outline that keeps names and marks apart. A label of a line sits on the outline beside its line, so only its letters keep clear of lines. */
export function inkOf(box: LabelBox): LabelBox {
  return {
    ...box,
    left: box.left + labelOutlineRoom,
    right: box.right - labelOutlineRoom,
    top: box.top + labelOutlineRoom,
    bottom: box.bottom - labelOutlineRoom,
  };
}

// The share of the width of a label that lies before its anchor, and the share of the width of a value by which the anchor moves when the value joins its name. A value follows its name away from the mark of its point, so a name that ends before its mark keeps that end and the value cannot cover the mark.
const anchorShares: Record<
  LabelPlace["anchor"],
  { label: number; value: number }
> = {
  start: { label: 0, value: 0 },
  middle: { label: 0.5, value: 0.5 },
  end: { label: 1, value: 0 },
};

/** The share of the width of a value by which the anchor of a label moves when the value joins its name. */
export const labelValueShift: Record<LabelPlace["anchor"], number> = {
  start: anchorShares.start.value,
  middle: anchorShares.middle.value,
  end: anchorShares.end.value,
};

/** The box of a label of a width at a place in a plot of a size, with the outline around its letters. */
export function labelBoxOf(
  place: LabelPlace,
  width: number,
  size: { width: number; height: number },
): LabelBox {
  const anchor = place.at.x * size.width + place.dx;
  const baseline = place.at.y * size.height + place.dy;
  const left = anchor - anchorShares[place.anchor].label * width;
  return {
    at: place.at,
    fixed: false,
    left: left - labelOutlineRoom,
    right: left + width + labelOutlineRoom,
    top: baseline - labelAscent - labelOutlineRoom,
    bottom: baseline + labelDescent + labelOutlineRoom,
  };
}
