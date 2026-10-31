import { expect, test } from "vitest";
import { rupiah } from "~/units/rupiah";
import { quoteChange } from "./price-change";

// The expected values were computed with the decimal module of Python at 20 significant digits, from the closes of 30 October 2026.
const quotedAt = new Date("2026-10-30T09:14:55.000Z");

test("computes the rise of a stock from its previous close", () => {
  expect(
    quoteChange({
      kind: "stock",
      code: "BBCA",
      price: rupiah(4980),
      previousClose: rupiah(4940),
      quotedAt,
    }),
  ).toBeCloseTo(0.008097165991902834, 15);
});

test("computes the fall of an index from its previous level", () => {
  expect(
    quoteChange({
      kind: "index",
      code: "IHSG",
      level: 5057.05,
      previousLevel: 5098.06,
      quotedAt,
    }),
  ).toBeCloseTo(-0.00804423643503607, 15);
});

test("computes no change when the price equals the previous close", () => {
  expect(
    quoteChange({
      kind: "stock",
      code: "TLKM",
      price: rupiah(1980),
      previousClose: rupiah(1980),
      quotedAt,
    }),
  ).toBe(0);
});
