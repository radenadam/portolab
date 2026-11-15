import { expect, test } from "vitest";
import { compareRoundedNumbers } from "./compare-rounded-numbers";
import { indexPoints } from "./units/index-points";

test("compares index levels at the hundredth that the reader sees", () => {
  // These pairs straddle the half-hundredth boundary of Intl's default halfExpand rounding.
  for (const [first, second, expected] of [
    [100.001, 100.004, "none"],
    [100.005, 100.004, "rise"],
    [100.004, 100.005, "fall"],
    [100.005, 100.014, "none"],
  ] as const) {
    expect(
      compareRoundedNumbers(
        indexPoints(first),
        indexPoints(second),
        "indexLevel",
      ),
    ).toBe(expected);
  }
});
