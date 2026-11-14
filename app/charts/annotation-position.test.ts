import { expect, test } from "vitest";
import { annotationPosition } from "./annotation-position";

test("places course dates between trading dates and omits dates outside the chart", () => {
  const points = ["2026-10-30", "2026-11-02", "2026-11-03"].map((date) => ({
    date,
  }));
  // By hand, Saturday is one of three calendar days from Friday to Monday, and those marks are half the plot apart.
  expect(annotationPosition(points, "2026-10-31")).toBeCloseTo(1 / 6, 15);
  expect(annotationPosition(points, "2026-10-30")).toBe(0);
  expect(annotationPosition(points, "2026-11-02")).toBe(0.5);
  expect(annotationPosition(points, "2026-11-03")).toBe(1);
  expect(annotationPosition(points, "2026-10-29")).toBeUndefined();
  expect(annotationPosition(points, "2026-11-04")).toBeUndefined();
  expect(annotationPosition([], "2026-11-02")).toBeUndefined();
  expect(annotationPosition(points.slice(0, 1), "2026-10-30")).toBe(1);
});
