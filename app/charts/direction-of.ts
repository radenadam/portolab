import { compareRoundedNumbers } from "../compare-rounded-numbers.ts";
import type { SplitAdjustedRupiah } from "../units/split-adjusted-rupiah.ts";
import type { ChangeDirection } from "../formatting.ts";

/** Sparklines and full charts share this comparison so they agree about a stock's direction. */
export function directionOf(
  first: SplitAdjustedRupiah,
  latest: SplitAdjustedRupiah,
): ChangeDirection {
  return compareRoundedNumbers(latest, first, "number");
}
