import { expect, test } from "vitest";
import { plotFraction } from "~/units/plot-fraction";
import { tipAcross, tipDown } from "./tip-placement";

test("puts the tooltip after its point in the left half of the plot and before it in the right half, never past an edge of the plot", () => {
  expect(tipAcross(plotFraction(0))).toEqual({
    left: "clamp(0px, calc(0% + var(--space-3)), calc(100% - var(--width-chart-tip)))",
  });
  expect(tipAcross(plotFraction(0.5))).toEqual({
    left: "clamp(0px, calc(50% + var(--space-3)), calc(100% - var(--width-chart-tip)))",
  });
  expect(tipAcross(plotFraction(0.75))).toEqual({
    right:
      "clamp(0px, calc(25% + var(--space-3)), calc(100% - var(--width-chart-tip)))",
  });
});

test("puts the tooltip below its point in the upper half of the plot and above it in the lower half", () => {
  expect(tipDown(plotFraction(0))).toEqual({
    top: "calc(0% + var(--space-3))",
  });
  expect(tipDown(plotFraction(0.5))).toEqual({
    top: "calc(50% + var(--space-3))",
  });
  expect(tipDown(plotFraction(0.75))).toEqual({
    bottom: "calc(25% + var(--space-3))",
  });
});
