import { expect, test } from "vitest";
import { priceChange } from "./price-change";

// The expected values were computed with the decimal module of Python at 20 significant digits, from the closes of 30 October 2026.

test("computes a rise from the previous close", () => {
  expect(priceChange(4980, 4940)).toBeCloseTo(0.008097165991902834, 15);
});

test("computes a fall from the previous close", () => {
  expect(priceChange(5057.05, 5098.06)).toBeCloseTo(-0.00804423643503607, 15);
});

test("computes no change when the price equals the previous close", () => {
  expect(priceChange(1980, 1980)).toBe(0);
});
