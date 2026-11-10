import { expect, test } from "vitest";
import { pixels } from "~/units/pixels";
import type { Pixels } from "~/units/pixels";
import { placePointLabels } from "./point-labels";
import type { PointLabel } from "./point-labels";

// With text of 10 pixels, a label of four characters is 24 pixels wide and 12 pixels high, and it keeps 3 pixels from a mark with a radius of 3 pixels, so its box starts 6 pixels from the middle of the mark. Its baseline lies 9 pixels below the top of its box.
const em = pixels(10);
const area = {
  left: pixels(0),
  top: pixels(10),
  right: pixels(200),
  bottom: pixels(200),
};

// A line along the bottom of the area crosses no label of these tests.
function roomWithLine(start: number, end: number) {
  return {
    area,
    line: {
      start: { x: pixels(0), y: pixels(start) },
      end: { x: pixels(200), y: pixels(end) },
    },
  };
}

const room = roomWithLine(195, 195);

function point(
  name: string,
  [left, top]: readonly [number, number],
  isLabelled: boolean,
): {
  name: string;
  x: Pixels;
  y: Pixels;
  radius: Pixels;
  label: PointLabel | undefined;
} {
  return {
    name,
    x: pixels(left),
    y: pixels(top),
    radius: pixels(3),
    label: isLabelled ? { text: name, subscript: "" } : undefined,
  };
}

test("places a label to the right of its point, then to the left, above, and below, and leaves out a label without room", () => {
  const crowded = ["AAAA", "BBBB", "CCCC", "DDDD", "EEEE"].map((name) =>
    point(name, [100, 100], true),
  );
  expect(placePointLabels(crowded, room, em)).toEqual([
    { name: "AAAA", label: { text: "AAAA", subscript: "" }, x: 106, y: 103 },
    { name: "BBBB", label: { text: "BBBB", subscript: "" }, x: 70, y: 103 },
    { name: "CCCC", label: { text: "CCCC", subscript: "" }, x: 88, y: 91 },
    { name: "DDDD", label: { text: "DDDD", subscript: "" }, x: 88, y: 115 },
  ]);
});

test("keeps a label clear of the mark of every labelled point, but lets it cover the mark of a point without a label", () => {
  // The right of AAAA reaches from 106 to 130, which covers the mark of BBBB from 112 to 118, so AAAA takes the left, from 70 to 94, over the mark of the point without a label at 85.
  const points = [
    point("AAAA", [100, 100], true),
    point("BBBB", [115, 100], true),
    point("CCCC", [85, 100], false),
  ];
  expect(
    placePointLabels(points, room, em).map(({ name, x, y }) => ({
      name,
      x,
      y,
    })),
  ).toEqual([
    { name: "AAAA", x: 70, y: 103 },
    { name: "BBBB", x: 121, y: 103 },
  ]);
});

test("keeps a label inside its area", () => {
  // At 15 pixels, the boxes to the right and to the left would start 1 pixel above the area, and the box above it far above, so the label takes the box below.
  expect(
    placePointLabels([point("AAAA", [100, 15], true)], room, em),
  ).toMatchObject([{ x: 88, y: 30 }]);
});

test("measures a subscript at three quarters of the width of its text, so a symbol with a subscript keeps its subscript clear of the next mark", () => {
  // R with the subscript f is 0.6 + 0.45 sizes of text wide, so its box to the right reaches from 106 to 116.5 and covers the mark of BBBB from 116 to 122, and it takes the left, from 83.5. R without a subscript reaches only to 112, so it keeps the right.
  const neighbour = point("BBBB", [119, 100], true);
  const subscripted = {
    ...point("riskFree", [100, 100], true),
    label: { text: "R", subscript: "f" },
  };
  expect(placePointLabels([subscripted, neighbour], room, em).at(0)).toEqual({
    name: "riskFree",
    label: { text: "R", subscript: "f" },
    x: 83.5,
    y: 103,
  });
  expect(
    placePointLabels([point("R", [100, 100], true), neighbour], room, em).at(0),
  ).toEqual({ name: "R", label: { text: "R", subscript: "" }, x: 106, y: 103 });
});

test("places a label where the line does not cross it, and where the line crosses every place, in the first place that has room", () => {
  // A level line through the point crosses the boxes to the right and to the left, so the label takes the box above. A line that rises 0.75 pixels for each pixel through the point crosses all four boxes, so the label takes the box to the right.
  const label = point("AAAA", [100, 100], true);
  expect(placePointLabels([label], roomWithLine(100, 100), em)).toMatchObject([
    { x: 88, y: 91 },
  ]);
  expect(placePointLabels([label], roomWithLine(25, 175), em)).toMatchObject([
    { x: 106, y: 103 },
  ]);
});
