import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { largestAffordableLots } from "./largest-affordable-lots";
import { costRatesForTest } from "./rules-for-test";

const rates = costRatesForTest("2026-11-02");

function largestAt(cash: number, price: number): number {
  return largestAffordableLots(
    rupiah(cash),
    { price: rupiah(price), shares: shares(100) },
    rates,
  );
}

// The costs were computed with the decimal module of Python as the value of the lots with a fee of 0.15%, rounded to a whole rupiah with ROUND_HALF_UP. So 4 lots at Rp4,980 cost Rp1,994,988, 200 lots cost Rp99,749,400, and 1 lot at Rp15 costs Rp1,502.

test("finds the most lots whose value and fee the cash pays for", () => {
  expect(largestAt(2_000_000, 4_980)).toBe(4);
  expect(largestAt(99_749_400, 4_980)).toBe(200);
  expect(largestAt(99_749_399, 4_980)).toBe(199);
});

test("finds no lot when the cash does not pay for one", () => {
  expect(largestAt(400_000, 4_980)).toBe(0);
});

test("counts a lot whose fee rounds down to less than the exact fee", () => {
  // The exact cost of 1 lot at Rp15 is Rp1,502.25, so Rp1,502 pays for 0.9998 lots without the rounding of the fee.
  expect(largestAt(1_502, 15)).toBe(1);
  expect(largestAt(1_501, 15)).toBe(0);
});
