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
}

/** A label of a point, by the key of the mark of the point. */
interface PointLabel {
  key: string;
  text: string;
}

/** The labels of a map, in the order in which they take their places. */
export interface MapLabels {
  /** The names of the points of the reader, which keep a place where no place follows every rule, as decision 0035 sets. */
  kept: readonly PointLabel[];
  /** The labels of the lines of the map, each with its places in order of preference. A label takes the first place that follows every rule, or it is left out. */
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
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// The box of a label reaches from the top of its capitals to the bottom of its descenders, with a little room at its sides, as the prototype of decision 0028 measures it, at 12 pixels to the size of its text.
const ascent = 0.92;
const descent = 0.25;
const sideRoom = 0.17;
// Two labels keep this gap, so that they never read as one, and a label keeps a little room from a mark that is not its own.
const labelGap = { across: 0.67, down: 0.25 };
const markRoom = 0.08;
// A label may reach a little below the plot, over the room above the texts of the marks of the axis.
const bottomOverhang = 0.33;
// A label stands this far from the edge of its mark, or farther in two steps where the nearer places break a rule.
const markDistance = 0.42;
const fartherSteps = [0, 0.67, 1.5];
// A label at a corner of its mark stands on the diagonal at the same distance, so its corner touches the circle around the mark.
const diagonal = Math.SQRT1_2;
// A place that breaks a rule costs more than any distance from its point, so a cost from ruleBroken on means a broken rule. Lying nearer to another point is the lesser rule, so a name of the reader that has to break a rule rather lies near another point than covers a mark or a label.
const coverCost = 1000;
const nearerCost = 500;
const ruleBroken = 100;
const costPerDistance = 0.01;

const anchorShares: Record<TextAnchor, number> = {
  start: 0,
  middle: 0.5,
  end: 1,
};

/** Places the labels of a map in a plot of a size in sizes of the text of the labels, as decision 0035 sets. A label of a point sits beside its mark, clear of every other mark, nearer to its own point than to any other point, and with a gap from every other label. A name of the reader keeps the place that breaks the fewest rules when none follows them all, and a name of another point without such a place is left out. Each label of a line takes the first of its places that clears every mark and every label placed before it. The names of the reader come first, then the labels of the lines, then the other names. */
export function placeMapLabels(
  labels: MapLabels,
  plot: {
    size: { width: number; height: number };
    marks: readonly LabelledMark[];
    widthOf: (text: string) => number;
  },
): PlacedLabels {
  const { size, marks, widthOf } = plot;
  const placedBoxes: Box[] = [];
  const points = new Map<string, LabelPlace>();
  const lines = new Map<string, LabelPlace>();
  const markOf = new Map(marks.map((mark) => [mark.key, mark]));
  const placePoint = (label: PointLabel, isKept: boolean): void => {
    const mark = markOf.get(label.key);
    if (mark === undefined) {
      throw new Error(`The map has a label of ${label.key} but no mark of it.`);
    }
    const width = widthOf(label.text);
    let best: { place: LabelPlace; box: Box; cost: number } | undefined;
    for (const place of placesAround(mark)) {
      const box = boxOf(place, width, size);
      const cost = costOf(box, mark, { size, marks, placedBoxes });
      if (best === undefined || cost < best.cost) {
        best = { place, box, cost };
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
      const box = boxOf(place, width, size);
      if (
        contains(size, box, 0) &&
        !marks.some((mark) => overlaps(box, boxAround(mark, size))) &&
        !hitsLabel(box, placedBoxes)
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
  return { points, lines };
}

/** The width of a text in Instrument Sans in semibold, the font of the labels, in sizes of the text, as the server estimates it before a browser measures the text. A browser measured the letters of the font: a capital is 0.69 of the size of the text wide on average, a small letter 0.54, a figure 0.6, and a space 0.19, and the estimate rounds each up a little, so it leaves a label more room rather than less. Any other character, such as a sign, counts as wide as a figure, which is at least as wide as the signs of a value, such as + and %. */
export function estimatedLabelWidth(text: string): number {
  let width = 0;
  for (const character of text) {
    width += characterWidth(character);
  }
  return width;
}

function characterWidth(character: string): number {
  if (character === " ") {
    return 0.2;
  }
  if (/\p{Lu}/u.test(character)) {
    return 0.7;
  }
  if (/\p{Ll}/u.test(character)) {
    return 0.55;
  }
  return 0.6;
}

function placesAround(mark: LabelledMark): LabelPlace[] {
  const places: LabelPlace[] = [];
  const middle = (ascent - descent) / 2;
  for (const farther of fartherSteps) {
    const distance = mark.outerRadius + markDistance + farther;
    const corner = distance * diagonal;
    for (const [dx, dy, anchor] of [
      [distance, middle, "start"],
      [-distance, middle, "end"],
      [corner, -corner - descent, "start"],
      [corner, corner + ascent, "start"],
      [-corner, -corner - descent, "end"],
      [-corner, corner + ascent, "end"],
      [0, -distance - descent, "middle"],
      [0, distance + ascent, "middle"],
    ] as const) {
      places.push({ at: mark.position, dx, dy, anchor });
    }
  }
  return places;
}

function costOf(
  box: Box,
  mark: LabelledMark,
  map: {
    size: { width: number; height: number };
    marks: readonly LabelledMark[];
    placedBoxes: readonly Box[];
  },
): number {
  const { size, marks, placedBoxes } = map;
  if (!contains(size, box, bottomOverhang)) {
    return Number.POSITIVE_INFINITY;
  }
  const ownDistance = distanceTo(box, centerOf(mark, size));
  let cost = costPerDistance * ownDistance;
  if (hitsLabel(box, placedBoxes)) {
    cost += coverCost;
  }
  for (const other of marks) {
    if (other.key === mark.key) {
      continue;
    }
    if (overlaps(box, boxAround(other, size))) {
      cost += coverCost;
    }
    if (distanceTo(box, centerOf(other, size)) <= ownDistance + markRoom) {
      cost += nearerCost;
    }
  }
  return cost;
}

function boxOf(
  place: LabelPlace,
  width: number,
  size: { width: number; height: number },
): Box {
  const anchor = place.at.x * size.width + place.dx;
  const baseline = place.at.y * size.height + place.dy;
  const left = anchor - anchorShares[place.anchor] * width;
  return {
    left: left - sideRoom,
    right: left + width + sideRoom,
    top: baseline - ascent,
    bottom: baseline + descent,
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
): Box {
  const center = centerOf(mark, size);
  const radius = mark.outerRadius + markRoom;
  return {
    left: center.x - radius,
    right: center.x + radius,
    top: center.y - radius,
    bottom: center.y + radius,
  };
}

function contains(
  size: { width: number; height: number },
  box: Box,
  overhang: number,
): boolean {
  return (
    box.left >= 0 &&
    box.right <= size.width &&
    box.top >= 0 &&
    box.bottom <= size.height + overhang
  );
}

function hitsLabel(box: Box, placedBoxes: readonly Box[]): boolean {
  const spaced = {
    left: box.left - labelGap.across,
    right: box.right + labelGap.across,
    top: box.top - labelGap.down,
    bottom: box.bottom + labelGap.down,
  };
  return placedBoxes.some((other) => overlaps(spaced, other));
}

function overlaps(first: Box, second: Box): boolean {
  return (
    first.left < second.right &&
    second.left < first.right &&
    first.top < second.bottom &&
    second.top < first.bottom
  );
}

function distanceTo(box: Box, point: { x: number; y: number }): number {
  return Math.hypot(
    Math.max(box.left - point.x, 0, point.x - box.right),
    Math.max(box.top - point.y, 0, point.y - box.bottom),
  );
}
