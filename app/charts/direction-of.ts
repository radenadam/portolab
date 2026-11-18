import { compareRoundedNumbers } from "../compare-rounded-numbers.ts";
import type { SplitAdjustedRupiah } from "../units/split-adjusted-rupiah.ts";
import type { IndexPoints } from "../units/index-points.ts";
import type { ChangeDirection } from "../formatting.ts";

/** Sparklines and full charts share the rounding of their prices, so their direction agrees with what the reader sees. */
export function directionOf(
  first: SplitAdjustedRupiah,
  latest: SplitAdjustedRupiah,
): ChangeDirection;
export function directionOf(
  first: IndexPoints,
  latest: IndexPoints,
  kind: "index",
): ChangeDirection;
export function directionOf(
  first: SplitAdjustedRupiah | IndexPoints,
  latest: SplitAdjustedRupiah | IndexPoints,
  kind?: "index",
): ChangeDirection {
  return compareRoundedNumbers(
    latest,
    first,
    kind === undefined ? "number" : "indexLevel",
  );
}
