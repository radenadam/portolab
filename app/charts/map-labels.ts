import { boxesOverlap, distanceToBox } from "./label-box";
import type { LabelBox } from "./label-box";
import { labelAscent, labelDescent, placesAroundMark } from "./label-places";
import type { PlotPosition } from "./plot";

/** Where a text starts, has its middle, or ends, at its position. */
type TextAnchor = "start" | "middle" | "end";

/** A place of a label: a position of the plot, and how far from it the label starts, has its middle, or ends across, and has its baseline down, in sizes of the text of the labels. */
export interface LabelPlace {
  at: PlotPosition;
  dx: number;
  dy: number;
  anchor: TextAnchor;
}

/** A mark of the map that labels keep clear of: the key of its point, its position, and the radius of the circle that holds all that it draws, in sizes of the text of the labels. */
export interface LabelledMark {
  key: string;
  position: PlotPosition;
  outerRadius: number;
  /** Fixed labels also leave room for the ring that selection adds. */
  selectionRadius?: number;
}

/** A label of a point, by the key of the mark of the point. */
interface PointLabel {
  key: string;
  text: string;
  value?: string | undefined;
}

/** The labels of a map, in the order in which they take their places. */
export interface MapLabels {
  /** The names of the portfolio and every holding, which keep a place where no place follows every rule, as decision 0035 sets. */
  kept: readonly PointLabel[];
  /** The fixed labels of the map, each with its places in order of preference. A label takes the first place that follows every rule, or it is left out. */
  lines: readonly {
    key: string;
    text: string;
    places: readonly LabelPlace[];
  }[];
  /** The names of the other points, which take their best place that follows every rule, or are left out. */
  others: readonly PointLabel[];
}

/** Where a map draws its labels, by the key of each label that has a place. */
export interface PlacedLabels {
  points: Map<string, LabelPlace>;
  lines: Map<string, LabelPlace>;
  values: Set<string>;
}

const sideRoom = 0.17;
// Two labels keep this gap, so that they never read as one, and a label keeps a little room from a mark that is not its own.
const labelGap = { across: 0.67, down: 0.25 };
const markRoom = 0.08;
// A label may reach a little below the plot, over the room above the texts of the marks of the axis.
const bottomOverhang = 0.33;
// The gutter of the return marks can hold a kept name that has no place within the plot.
export const keptNameRoom = 1.5;
// Names keep their gap first and their link to their own point next, before they keep clear of other marks. A cost from ruleBroken on means a broken rule.
const coverCost = 1000;
const labelCoverCost = 1000000;
const nearerCost = 10000;
const ruleBroken = 100;
const costPerDistance = 0.01;

const anchorShares: Record<TextAnchor, number> = {
  start: 0,
  middle: 0.5,
  end: 1,
};

/** Places the labels of a map in a plot of a size in sizes of the text of the labels, as decision 0035 sets. A label of a point sits beside its mark, clear of every other mark, nearer to its own point than to any other point, and with a gap from every other label. A name of the portfolio or a holding keeps the place that breaks the fewest rules when none follows them all, and a name of another point without such a place is left out. Each fixed label takes the first of its places that clears every mark and every label placed before it. The portfolio and every holding come first, then the fixed labels, then the other names. */
export function placeMapLabels(
  labels: MapLabels,
  plot: {
    size: { width: number; height: number };
    marks: readonly LabelledMark[];
    widthOf: (text: string) => number;
    /** A server estimate is a minimum size, so fixed labels must also clear marks and names as the plot grows. */
    canGrow?: boolean;
  },
): PlacedLabels {
  const { size, marks, widthOf, canGrow = false } = plot;
  const placedBoxes: LabelBox[] = [];
  const points = new Map<string, LabelPlace>();
  const lines = new Map<string, LabelPlace>();
  const markOf = new Map(marks.map((mark) => [mark.key, mark]));
  const placePoint = (label: PointLabel, isKept: boolean): void => {
    const mark = markOf.get(label.key);
    if (mark === undefined) {
      throw new Error(`The map has a label of ${label.key} but no mark of it.`);
    }
    const width = widthOf(label.text);
    let best: { place: LabelPlace; box: LabelBox; cost: number } | undefined;
    const consider = (place: LabelPlace, leftRoom: number): void => {
      const box = boxOf(place, width, size);
      const cost = costOf(box, mark, {
        size,
        marks,
        placedBoxes,
        leftRoom,
        canGrow,
      });
      if (best === undefined || cost + Number.EPSILON < best.cost) {
        best = { place, box, cost };
      }
    };
    for (const place of placesAroundMark(mark)) {
      consider(place, 0);
    }
    if (isKept && (best === undefined || best.cost >= ruleBroken)) {
      // A large dot can leave no room between its edge and a neighbor. Its name can cross its own mark and use the gutter before it reads as another point's name.
      for (const place of placesAroundMark(mark, markRoom)) {
        const box = boxOf(place, width, size);
        const shift =
          Math.max(0, -keptNameRoom - box.left) -
          Math.max(0, box.right - size.width);
        consider({ ...place, dx: place.dx + shift }, keptNameRoom);
      }
    }
    if (
      best !== undefined &&
      Number.isFinite(best.cost) &&
      (isKept || best.cost < ruleBroken)
    ) {
      placedBoxes.push(best.box);
      points.set(label.key, best.place);
    }
  };
  for (const label of labels.kept) {
    placePoint(label, true);
  }
  for (const label of labels.lines) {
    const width = widthOf(label.text);
    for (const place of label.places) {
      const box = { ...boxOf(place, width, size), fixed: true };
      if (
        contains(size, box, { bottom: 0, left: 0 }) &&
        !marks.some((mark) =>
          boxesOverlap(
            box,
            boxAround(mark, size, mark.selectionRadius),
            canGrow,
          ),
        ) &&
        !hitsLabel(box, placedBoxes, canGrow)
      ) {
        placedBoxes.push(box);
        lines.set(label.key, place);
        break;
      }
    }
  }
  for (const label of labels.others) {
    placePoint(label, false);
  }
  return {
    points,
    lines,
    values: extendPointValues(
      labels,
      { size, marks, widthOf, canGrow },
      { points, placedBoxes, markOf },
    ),
  };
}

function extendPointValues(
  labels: MapLabels,
  plot: {
    size: { width: number; height: number };
    marks: readonly LabelledMark[];
    widthOf: (text: string) => number;
    canGrow: boolean;
  },
  placement: {
    points: Map<string, LabelPlace>;
    placedBoxes: LabelBox[];
    markOf: Map<string, LabelledMark>;
  },
): Set<string> {
  const { size, marks, widthOf } = plot;
  const { points, placedBoxes, markOf } = placement;
  const values = new Set<string>();
  for (const label of [...labels.kept, ...labels.others]) {
    const place = points.get(label.key);
    const mark = markOf.get(label.key);
    if (label.value === undefined || place === undefined || mark === undefined)
      continue;
    const width = widthOf(label.text);
    const fullWidth = widthOf(`${label.text} ${label.value}`);
    const fullPlace = {
      ...place,
      dx: place.dx + (fullWidth - width) * anchorShares[place.anchor],
    };
    const original = boxOf(place, width, size);
    const withoutOwn = placedBoxes.filter(
      (box) => box.left !== original.left || box.top !== original.top,
    );
    const box = boxOf(fullPlace, fullWidth, size);
    if (
      costOf(box, mark, {
        size,
        marks,
        placedBoxes: withoutOwn,
        leftRoom: keptNameRoom,
        canGrow: plot.canGrow,
      }) < ruleBroken
    ) {
      points.set(label.key, fullPlace);
      placedBoxes.push(box);
      values.add(label.key);
    }
  }
  return values;
}

function costOf(
  box: LabelBox,
  mark: LabelledMark,
  map: {
    size: { width: number; height: number };
    marks: readonly LabelledMark[];
    placedBoxes: readonly LabelBox[];
    leftRoom: number;
    canGrow: boolean;
  },
): number {
  const { size, marks, placedBoxes } = map;
  if (!contains(size, box, { bottom: bottomOverhang, left: map.leftRoom })) {
    return Number.POSITIVE_INFINITY;
  }
  // The padding separates names, but only their letters decide which point they read as belonging to.
  const ink = {
    ...box,
    left: box.left + sideRoom,
    right: box.right - sideRoom,
  };
  const ownDistance = distanceToBox(ink, centerOf(mark, size));
  let cost = costPerDistance * ownDistance;
  if (hitsLabel(box, placedBoxes, map.canGrow)) {
    cost += labelCoverCost;
  }
  for (const other of marks) {
    if (other.key === mark.key) {
      continue;
    }
    if (boxesOverlap(box, boxAround(other, size))) {
      cost += coverCost;
    }
    if (distanceToBox(ink, centerOf(other, size)) <= ownDistance + markRoom) {
      cost += nearerCost;
    }
  }
  return cost;
}

function boxOf(
  place: LabelPlace,
  width: number,
  size: { width: number; height: number },
): LabelBox {
  const anchor = place.at.x * size.width + place.dx;
  const baseline = place.at.y * size.height + place.dy;
  const left = anchor - anchorShares[place.anchor] * width;
  return {
    at: place.at,
    fixed: false,
    left: left - sideRoom,
    right: left + width + sideRoom,
    top: baseline - labelAscent,
    bottom: baseline + labelDescent,
  };
}

function centerOf(
  mark: LabelledMark,
  size: { width: number; height: number },
): { x: number; y: number } {
  return { x: mark.position.x * size.width, y: mark.position.y * size.height };
}

function boxAround(
  mark: LabelledMark,
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

function contains(
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

function hitsLabel(
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
