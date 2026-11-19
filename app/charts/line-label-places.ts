import { plotFraction } from "~/units/plot-fraction";
import type { PlotFraction } from "~/units/plot-fraction";
import type { LabelPlace } from "./map-labels";
import type { PlotPosition } from "./plot";

// The label of the line of the return of the IHSG tries places along the line from its left end and then from its right end, above the line and then below it, so it names the line where no point or line lies. The label of the line sits above the end of the line, or below it, as the prototype of decision 0028 places them.
const levelStart = 0.83;
const levelStep = 2.67;
const levelSteps = 8;
// A band of points can fill the line, so labels try a little farther above and below it after the nearer places.
const levelOffsets = [
  [-0.5, 1.17],
  [-1.5, 2.17],
];
const lineEndPlaces = [
  { dx: -0.33, dy: -0.67 },
  { dx: -0.33, dy: 1.33 },
  { dx: -3.33, dy: 1.33 },
];

/** The places of the label of the end of the line of a map, above its end and then below it. */
export function comparisonLinePlaces(
  line: { end: PlotPosition } | undefined,
): LabelPlace[] {
  if (line === undefined) return [];
  return lineEndPlaces.map(({ dx, dy }) => ({
    at: line.end,
    dx,
    dy,
    anchor: "end",
  }));
}

/** The places of the label of a line across the plot at a height, from its left end and then, because the line of the beta of the IHSG crosses the plot, from its right end. */
export function levelPlaces(height: PlotFraction): LabelPlace[] {
  return [
    ...placesFrom({ x: plotFraction(0), y: height }, "start"),
    ...placesFrom({ x: plotFraction(1), y: height }, "end"),
  ];
}

function placesFrom(at: PlotPosition, anchor: "start" | "end"): LabelPlace[] {
  const direction = anchor === "start" ? 1 : -1;
  const places: LabelPlace[] = [];
  for (const offsets of levelOffsets) {
    for (let step = 0; step <= levelSteps; step += 1) {
      for (const dy of offsets) {
        places.push({
          at,
          dx: direction * (levelStart + step * levelStep),
          dy,
          anchor,
        });
      }
    }
  }
  return places;
}
