import { expect, test } from "vitest";
import { roundedShare } from "./rounded-share";

// The expected values were computed with the decimal module of Python, which gives 3.5 for 7 / 2, 1,500.0015 for 15 / 10,000 of 1,000,001, and 902,071,005,362,310.1485 for 10,015 / 10,000 of 900,719,925,474,099.

test("rounds a share down, up, and to the nearest whole number with halves up", () => {
  const half = { numerator: 1, denominator: 2 };
  expect(roundedShare(7, half, "down")).toBe(3);
  expect(roundedShare(7, half, "up")).toBe(4);
  expect(roundedShare(7, half, "halfUp")).toBe(4);
  expect(
    roundedShare(1_000_001, { numerator: 15, denominator: 10_000 }, "halfUp"),
  ).toBe(1_500);
  expect(
    roundedShare(1_000_001, { numerator: 15, denominator: 10_000 }, "up"),
  ).toBe(1_501);
});

test("keeps a share exact whose product passes the whole numbers that a double holds exactly", () => {
  // 900,719,925,474,099 × 10,015 is above 2^53, and a double would round the product before the division.
  expect(
    roundedShare(
      900_719_925_474_099,
      { numerator: 10_015, denominator: 10_000 },
      "down",
    ),
  ).toBe(902_071_005_362_310);
});
