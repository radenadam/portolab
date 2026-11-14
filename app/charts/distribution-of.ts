import { plotFraction } from "~/units/plot-fraction";
import type { PlotFraction } from "~/units/plot-fraction";

// The bars must remain distinct at the width of the phone reference.
const binCount = 8;

/** Scaling to the busiest bin keeps the distribution inside the room reserved at the edges. */
export function distributionOf(
  values: readonly PlotFraction[],
): { at: PlotFraction; width: PlotFraction; share: number }[] {
  const counts = Array<number>(binCount).fill(0);
  for (const value of values) {
    const index = Math.min(binCount - 1, Math.floor(value * binCount));
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const maximum = Math.max(...counts);
  return counts.map((count, index) => ({
    at: plotFraction(index / binCount),
    width: plotFraction(1 / binCount),
    share: maximum === 0 ? 0 : count / maximum,
  }));
}
