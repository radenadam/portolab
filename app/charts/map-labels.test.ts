import { expect, test } from "vitest";
import { plotFraction } from "~/units/plot-fraction";
import { estimatedLabelWidth, placeMapLabels } from "./map-labels";
import type { LabelledMark, LabelPlace, MapLabels } from "./map-labels";

// Every length is in sizes of the text of the labels. A text of the tests is 0.6 of that size wide for each character.
function widthOf(text: string): number {
  return text.length * 0.6;
}

function mark(
  key: string,
  at: { x: number; y: number },
  outerRadius = 0.5,
): LabelledMark {
  return {
    key,
    position: { x: plotFraction(at.x), y: plotFraction(at.y) },
    outerRadius,
  };
}

function names(...keys: string[]): { key: string; text: string }[] {
  return keys.map((key) => ({ key, text: key }));
}

function others(keys: string[]): MapLabels {
  return { kept: [], lines: [], others: names(...keys) };
}

const size = { width: 20, height: 10 };

// A label stands 0.42 from the edge of its mark, and its baseline lies 0.335 below the middle of the mark, so the middle of its letters, which reach 0.92 above the baseline and 0.25 below it, meets the middle of the mark.
const beside = 0.5 + 0.42;
const middle = 0.335;

test("places the name of a point to the right of its mark, where its letters face the middle of the mark", () => {
  const point = mark("BBCA", { x: 0.5, y: 0.5 });
  expect(
    placeMapLabels(others(["BBCA"]), { size, marks: [point], widthOf }),
  ).toEqual({
    points: new Map([
      ["BBCA", { at: point.position, dx: beside, dy: middle, anchor: "start" }],
    ]),
    lines: new Map(),
  });
});

test("places the name of a point at the right edge of the plot to the left of its mark, so it stays inside the plot", () => {
  const point = mark("BBCA", { x: 0.98, y: 0.5 });
  expect(
    placeMapLabels(others(["BBCA"]), { size, marks: [point], widthOf }).points,
  ).toEqual(
    new Map([
      ["BBCA", { at: point.position, dx: -beside, dy: middle, anchor: "end" }],
    ]),
  );
});

test("places a name where it lies nearer to its own point than to any other point, so it never reads as the name of another point", () => {
  // The points stand 2 apart, so a name to the right of the first would lie nearer to the second.
  const first = mark("BBCA", { x: 0.5, y: 0.5 });
  const second = mark("TLKM", { x: 0.6, y: 0.5 });
  const placed = placeMapLabels(others(["BBCA", "TLKM"]), {
    size,
    marks: [first, second],
    widthOf,
  }).points;
  expect(placed.get("BBCA")).toEqual({
    at: first.position,
    dx: -beside,
    dy: middle,
    anchor: "end",
  });
  expect(placed.get("TLKM")).toEqual({
    at: second.position,
    dx: beside,
    dy: middle,
    anchor: "start",
  });
});

test("keeps a gap between two names, so a name moves away from a name beside it that it would only touch", () => {
  // The points stand 1.2 apart, one above the other, so their names to the right would stand 0.03 apart, closer than the gap of 0.25 between labels.
  const upper = mark("BBCA", { x: 0.2, y: 0.5 }, 0.3);
  const lower = mark("BBRI", { x: 0.2, y: 0.62 }, 0.3);
  const placed = placeMapLabels(others(["BBCA", "BBRI"]), {
    size,
    marks: [upper, lower],
    widthOf,
  }).points;
  expect(placed.get("BBCA")).toMatchObject({ anchor: "start", dx: 0.72 });
  expect(placed.get("BBRI")).not.toMatchObject({ dx: 0.72, dy: middle });
  expect(placed.get("BBRI")).toBeDefined();
});

/** Small marks 0.6 apart in 7 rows and 13 columns around a center, but not at the center. */
function gridAround(
  key: string,
  center: { x: number; y: number },
): LabelledMark[] {
  const marks: LabelledMark[] = [];
  for (let row = -3; row <= 3; row += 1) {
    for (let column = -6; column <= 6; column += 1) {
      if (row !== 0 || column !== 0) {
        marks.push(
          mark(
            `${key}${String(row)}${String(column)}`,
            {
              x: center.x + (column * 0.6) / size.width,
              y: center.y + (row * 0.6) / size.height,
            },
            0.2,
          ),
        );
      }
    }
  }
  return marks;
}

test("keeps the name of the reader beside its mark where every place breaks a rule, and leaves out the name of another point that has no place", () => {
  // A grid of small marks surrounds each of the two points closely on every side, so every place beside either point covers a mark.
  const marks: LabelledMark[] = [];
  for (const [key, center] of [
    ["portfolio", { x: 0.3, y: 0.5 }],
    ["BBCA", { x: 0.7, y: 0.5 }],
  ] as const) {
    marks.push(mark(key, center, 0.3), ...gridAround(key, center));
  }
  const placed = placeMapLabels(
    { kept: names("portfolio"), lines: [], others: names("BBCA") },
    { size, marks, widthOf },
  ).points;
  expect([...placed.keys()]).toEqual(["portfolio"]);
});

test("places the label of a line at the first of its places that clears every mark and every label placed before it, and leaves it out where none does", () => {
  const places: LabelPlace[] = [0.1, 0.4, 0.65].map((across) => ({
    at: { x: plotFraction(across), y: plotFraction(0.5) },
    dx: 0,
    dy: 0,
    anchor: "start",
  }));
  const label = { key: "level", text: "IHSG 0,70%", places };
  // A mark covers the first place, and the name of the reader, which takes its place first, covers the second.
  const covering = mark("BBCA", { x: 0.15, y: 0.47 });
  const own = mark("portfolio", { x: 0.25, y: 0.5 });
  const placed = placeMapLabels(
    { kept: names("portfolio"), lines: [label], others: [] },
    { size, marks: [covering, own], widthOf },
  );
  expect(placed.points.get("portfolio")).toMatchObject({ anchor: "start" });
  expect(placed.lines).toEqual(new Map([["level", places[2]]]));
  expect(
    placeMapLabels(
      {
        kept: [],
        lines: [{ ...label, places: places.slice(0, 1) }],
        others: [],
      },
      { size, marks: [covering], widthOf },
    ).lines,
  ).toEqual(new Map());
});

test("refuses a label of a point that the map has no mark of", () => {
  expect(() =>
    placeMapLabels(others(["BBCA"]), { size, marks: [], widthOf }),
  ).toThrow("The map has a label of BBCA but no mark of it.");
});

test("estimates the width of a name from the widths of the capitals, the small letters, the figures, the spaces, and the signs of the font of the labels", () => {
  expect(estimatedLabelWidth("BBCA")).toBeCloseTo(4 * 0.7, 12);
  expect(estimatedLabelWidth("Portofolio Anda")).toBeCloseTo(
    2 * 0.7 + 12 * 0.55 + 0.2,
    12,
  );
  expect(estimatedLabelWidth("IHSG 0,05%")).toBeCloseTo(
    4 * 0.7 + 0.2 + 5 * 0.6,
    12,
  );
});

// The letters of a label reach 0.92 above its baseline and 0.25 below it, and its box keeps 0.17 at each side.
interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function boxOf(
  place: LabelPlace,
  width: number,
  plot: { width: number; height: number },
): Box {
  const shares = { start: 0, middle: 0.5, end: 1 };
  const left =
    place.at.x * plot.width + place.dx - shares[place.anchor] * width - 0.17;
  const baseline = place.at.y * plot.height + place.dy;
  return {
    left,
    right: left + width + 0.34,
    top: baseline - 0.92,
    bottom: baseline + 0.25,
  };
}

// Two boxes lie apart when one ends before the other starts across or down.
function overlaps(first: Box, second: Box): boolean {
  const apartAcross = first.right <= second.left || second.right <= first.left;
  const apartDown = first.bottom <= second.top || second.bottom <= first.top;
  return !apartAcross && !apartDown;
}

// The point of a box nearest to a point is the point itself held inside the box.
function distance(box: Box, point: { x: number; y: number }): number {
  const nearest = {
    x: Math.min(Math.max(point.x, box.left), box.right),
    y: Math.min(Math.max(point.y, box.top), box.bottom),
  };
  return Math.hypot(point.x - nearest.x, point.y - nearest.y);
}

// The points of a crowded map: the portfolio, five stocks that it holds, and forty other stocks, at positions of a seeded random walk, so the test is the same on every run.
function crowdedMarks(): LabelledMark[] {
  let state = 7;
  const next = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return 0.05 + (state / 2147483648) * 0.9;
  };
  const marks: LabelledMark[] = [mark("portfolio", { x: 0.5, y: 0.5 }, 1.04)];
  for (let index = 0; index < 45; index += 1) {
    marks.push(
      mark(
        `S${String(index).padStart(3, "0")}`,
        { x: next(), y: next() },
        index < 5 ? 0.8 : 0.42,
      ),
    );
  }
  return marks;
}

for (const plot of [
  { name: "a phone", width: 22, height: 17 },
  { name: "a desktop", width: 75, height: 28 },
]) {
  test(`places the names of a crowded map on ${plot.name} apart from each other, inside the plot, clear of every other mark, and nearer to their own points, and keeps the name of the reader`, () => {
    const marks = crowdedMarks();
    const [own, ...stocks] = marks;
    if (own === undefined) {
      throw new Error("A crowded map has the point of the reader.");
    }
    const placed = placeMapLabels(
      {
        kept: [{ key: own.key, text: "Portofolio Anda" }],
        lines: [],
        others: stocks.map(({ key }) => ({ key, text: key })),
      },
      { size: plot, marks, widthOf: estimatedLabelWidth },
    ).points;
    expect(placed.has(own.key)).toBe(true);
    const boxes: { key: string; box: Box }[] = [];
    for (const [key, place] of placed) {
      const text = key === own.key ? "Portofolio Anda" : key;
      boxes.push({ key, box: boxOf(place, estimatedLabelWidth(text), plot) });
    }
    for (const [index, { key, box }] of boxes.entries()) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(plot.width);
      expect(box.top).toBeGreaterThanOrEqual(0);
      for (const other of boxes.slice(index + 1)) {
        expect(overlaps(box, other.box), `${key} and ${other.key}`).toBe(false);
      }
      if (key === own.key) {
        continue;
      }
      const center = (point: LabelledMark): { x: number; y: number } => ({
        x: point.position.x * plot.width,
        y: point.position.y * plot.height,
      });
      const ownMark = marks.find((candidate) => candidate.key === key);
      if (ownMark === undefined) {
        throw new Error(`The crowded map has no mark of ${key}.`);
      }
      for (const other of marks) {
        if (other.key === key) {
          continue;
        }
        const reach = other.outerRadius;
        const otherCenter = center(other);
        expect(
          overlaps(box, {
            left: otherCenter.x - reach,
            right: otherCenter.x + reach,
            top: otherCenter.y - reach,
            bottom: otherCenter.y + reach,
          }),
          `${key} covers ${other.key}`,
        ).toBe(false);
        expect(distance(box, center(ownMark))).toBeLessThan(
          distance(box, otherCenter),
        );
      }
    }
  });
}

test("places more names of a crowded map on a desktop than on a phone, where the marks lie farther apart", () => {
  const marks = crowdedMarks();
  const labels: MapLabels = {
    kept: [],
    lines: [],
    others: marks.map(({ key }) => ({ key, text: key })),
  };
  const phone = placeMapLabels(labels, {
    size: { width: 22, height: 17 },
    marks,
    widthOf: estimatedLabelWidth,
  });
  const desktop = placeMapLabels(labels, {
    size: { width: 75, height: 28 },
    marks,
    widthOf: estimatedLabelWidth,
  });
  // The map is crowded enough on a phone that some names find no place.
  expect(phone.points.size).toBeLessThan(marks.length);
  expect(desktop.points.size).toBeGreaterThan(phone.points.size);
});
