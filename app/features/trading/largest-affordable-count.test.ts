import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { largestAffordableCount } from "./largest-affordable-count";
import { costRatesForTest } from "./rules-for-test";

const rates = costRatesForTest("2026-11-02");

function largestLotsAt(cash: number, price: number): number {
  return largestAffordableCount(rupiah(cash), rupiah(price * 100), rates);
}

function highestLotPrice(cash: number): number {
  return largestAffordableCount(rupiah(cash), rupiah(100), rates);
}

// The costs were computed with the decimal module of Python as the value of a purchase with a fee of 0.15%, rounded to a whole rupiah with ROUND_HALF_UP. So 4 lots at Rp4,980 cost Rp1,994,988, 200 lots cost Rp99,749,400, 1 lot at Rp15 costs Rp1,502, 1 lot at Rp3,994 costs Rp399,999 and at Rp3,995 Rp400,099, and 1 lot at Rp1 costs Rp100.

test("finds the most lots whose value and fee the cash pays for", () => {
  expect(largestLotsAt(2_000_000, 4_980)).toBe(4);
  expect(largestLotsAt(99_749_400, 4_980)).toBe(200);
  expect(largestLotsAt(99_749_399, 4_980)).toBe(199);
});

test("finds no lot when the cash does not pay for one", () => {
  expect(largestLotsAt(400_000, 4_980)).toBe(0);
});

test("counts a lot whose fee rounds down to less than the exact fee", () => {
  // The exact cost of 1 lot at Rp15 is Rp1,502.25, so Rp1,502 pays for 0.9998 lots without the rounding of the fee.
  expect(largestLotsAt(1_502, 15)).toBe(1);
  expect(largestLotsAt(1_501, 15)).toBe(0);
});

test("finds the highest whole price at which the cash pays for 1 lot with its fee", () => {
  expect(highestLotPrice(400_000)).toBe(3_994);
  expect(highestLotPrice(399_998)).toBe(3_993);
  expect(highestLotPrice(100)).toBe(1);
  expect(highestLotPrice(99)).toBe(0);
});
