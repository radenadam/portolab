import type { LabelledMark, LabelPlace } from "./map-labels";

// A name reserves the full height of its font, including letters below the baseline.
export const labelAscent = 1;
export const labelDescent = 0.25;
const markDistance = 0.42;
const fartherSteps = [0, 0.67, 1.5];
const diagonal = Math.SQRT1_2;

export function placesAroundMark(
  mark: LabelledMark,
  nearest = mark.outerRadius + markDistance,
): LabelPlace[] {
  const places: LabelPlace[] = [];
  const middle = (labelAscent - labelDescent) / 2;
  for (const farther of fartherSteps) {
    const distance = nearest + farther;
    const corner = distance * diagonal;
    for (const [dx, dy, anchor] of [
      [distance, middle, "start"],
      [-distance, middle, "end"],
      [corner, -corner - labelDescent, "start"],
      [corner, corner + labelAscent, "start"],
      [-corner, -corner - labelDescent, "end"],
      [-corner, corner + labelAscent, "end"],
      [0, -distance - labelDescent, "middle"],
      [0, distance + labelAscent, "middle"],
    ] as const) {
      places.push({ at: mark.position, dx, dy, anchor });
    }
  }
  return places;
}
