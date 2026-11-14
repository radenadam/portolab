import { plotFraction } from "~/units/plot-fraction";
import type { PlotFraction } from "~/units/plot-fraction";
import { percentOf } from "./plot";

/** Where the tooltip of a point at a position across the plot stands: after the point in the left half of the plot and before it in the right half, a space apart from it, and never past an edge of the plot. The tooltip has the width of the token --width-chart-tip. */
export function tipAcross(
  across: PlotFraction,
): { left: string } | { right: string } {
  if (across <= 0.5) {
    return { left: withinPlot(percentOf(across)) };
  }
  return { right: withinPlot(percentOf(plotFraction(1 - across))) };
}

/** Where the tooltip of a point at a height of the plot stands: below the point in the upper half of the plot and above it in the lower half, a space apart from it, so the tooltip opens toward the larger part of the plot. */
export function tipDown(
  down: PlotFraction,
): { top: string } | { bottom: string } {
  if (down <= 0.5) {
    return { top: `calc(${percentOf(down)} + var(--space-3))` };
  }
  return {
    bottom: `calc(${percentOf(plotFraction(1 - down))} + var(--space-3))`,
  };
}

function withinPlot(distance: string): string {
  return `clamp(0px, calc(${distance} + var(--space-3)), calc(100% - var(--width-chart-tip)))`;
}
