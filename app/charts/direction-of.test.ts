import { expect, test } from "vitest";
import { splitAdjustedRupiah } from "../units/split-adjusted-rupiah.ts";
import { directionOf } from "./direction-of";
import { indexPoints } from "~/units/index-points";

test("compares index levels at their displayed precision without losing the precision of stock closes", () => {
  expect(directionOf(indexPoints(100), indexPoints(100.004), "index")).toBe(
    "none",
  );
  expect(directionOf(indexPoints(100.004), indexPoints(100.005), "index")).toBe(
    "rise",
  );
  expect(directionOf(indexPoints(100.005), indexPoints(100.004), "index")).toBe(
    "fall",
  );
  expect(
    directionOf(splitAdjustedRupiah(100), splitAdjustedRupiah(100.004)),
  ).toBe("rise");
});

test("gives identical shown prices no direction at either side of an Intl rounding boundary", () => {
  for (const [first, last, expected] of [
    [100.0001, 100.0004, "none"],
    [100.0004, 100.0005, "rise"],
    [100.0005, 100.0004, "fall"],
    [100.0005, 100.0014, "none"],
    [0.0001, 0.0004, "none"],
    [0.0004, 0.0005, "rise"],
  ] as const) {
    expect(
      directionOf(splitAdjustedRupiah(first), splitAdjustedRupiah(last)),
    ).toBe(expected);
  }
});
