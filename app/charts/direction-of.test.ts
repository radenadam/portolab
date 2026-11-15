import { expect, test } from "vitest";
import { splitAdjustedRupiah } from "../units/split-adjusted-rupiah.ts";
import { directionOf } from "./direction-of";

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
