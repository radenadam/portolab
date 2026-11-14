import { expect, test } from "vitest";
import { plotFraction } from "~/units/plot-fraction";
import { distributionOf } from "./distribution-of";

test("counts each edge position once and scales each bar to the most populated bin", () => {
  // By hand, the eight bins have counts 2, 1, 0, 0, 0, 0, 0, 1, so their heights relative to the largest are 1, 0.5, 0, 0, 0, 0, 0, 0.5.
  const bars = distributionOf([0, 0.1, 0.125, 1].map(plotFraction));
  expect(bars.map(({ share }) => share)).toEqual([1, 0.5, 0, 0, 0, 0, 0, 0.5]);
  expect(bars.map(({ at }) => at)).toEqual([
    0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875,
  ]);
  expect(bars.every(({ width }) => width === 0.125)).toBe(true);
  expect(distributionOf([]).every(({ share }) => share === 0)).toBe(true);
});
