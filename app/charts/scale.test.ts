import { expect, test } from "vitest";
import { cumulativeReturn } from "~/units/cumulative-return";
import { fractionOf, niceTicks, paddedRange } from "./scale";

test("widens the range of values by 8% of their spread on each side", () => {
  // The values spread over 5%, so each side gains 0.4%.
  const range = paddedRange(
    [0.03, -0.02, 0.01].map(cumulativeReturn),
    cumulativeReturn,
  );
  expect(range.min).toBeCloseTo(-0.024, 12);
  expect(range.max).toBeCloseTo(0.034, 12);
});

test("gives values without any spread half a percent on each side, so they still have a range to lie in", () => {
  expect(paddedRange([0, 0].map(cumulativeReturn), cumulativeReturn)).toEqual({
    min: -0.005,
    max: 0.005,
  });
});

test("places a value by its share of the range, from 0 at the smallest value to 1 at the largest", () => {
  const range = { min: cumulativeReturn(-0.02), max: cumulativeReturn(0.06) };
  expect(fractionOf(range, cumulativeReturn(-0.02))).toBe(0);
  expect(fractionOf(range, cumulativeReturn(0))).toBe(0.25);
  expect(fractionOf(range, cumulativeReturn(0.06))).toBe(1);
});

test("marks a range at the multiples of the smallest step of 1, 2, or 5 times a power of ten that gives at most the number of steps asked for", () => {
  // A range of 5.8% in 4 steps needs a step of at least 1.45%, so the step is 2%.
  expect(
    niceTicks(
      { min: cumulativeReturn(-0.024), max: cumulativeReturn(0.034) },
      4,
      cumulativeReturn,
    ),
  ).toEqual([-0.02, 0, 0.02]);
  // A range of 1% in 4 steps needs a step of at least 0.25%, so the step is 0.5%.
  expect(
    niceTicks(
      { min: cumulativeReturn(-0.005), max: cumulativeReturn(0.005) },
      4,
      cumulativeReturn,
    ),
  ).toEqual([-0.005, 0, 0.005]);
  // A range of 0.9 in 4 steps needs a step of at least 0.225, so the step is 0.5.
  expect(
    niceTicks(
      { min: cumulativeReturn(0.1), max: cumulativeReturn(1) },
      4,
      cumulativeReturn,
    ),
  ).toEqual([0.5, 1]);
});

test("marks zero as zero and never as a negative zero, which Intl would write with a minus sign", () => {
  const ticks = niceTicks(
    { min: cumulativeReturn(-0.001), max: cumulativeReturn(0.012) },
    4,
    cumulativeReturn,
  );
  expect(ticks).toEqual([0, 0.005, 0.01]);
  expect(Object.is(ticks[0], 0)).toBe(true);
});
