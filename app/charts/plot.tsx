import { useId } from "react";
import styles from "./plot.module.css";
import type { ReactNode } from "react";
import type { PlotFraction } from "~/units/plot-fraction";

/** A point of a plot, across from its left edge and down from its top edge. */
export interface PlotPosition {
  x: PlotFraction;
  y: PlotFraction;
}

/** A fraction of the plot as the percentage that an attribute of SVG takes, such as 37.5%, so the browser places a mark, a text, or a line at any size of the plot. */
export function percentOf(fraction: PlotFraction): string {
  return `${String(hundredthsOf(fraction))}%`;
}

// Two decimals of a percentage place a point within a tenth of a pixel on a plot of a thousand pixels, and they keep the page small.
function hundredthsOf(fraction: PlotFraction): number {
  return Math.round(fraction * 10_000) / 100;
}

/** A line through positions of the plot. Its drawing counts a hundred steps across and down, which the browser stretches over the plot at any size, while the stroke keeps its width. */
export function PlotLine({
  positions,
  className,
  area = false,
}: {
  positions: readonly PlotPosition[];
  className: string | undefined;
  area?: boolean;
}): ReactNode {
  const areaId = useId();
  let path = "";
  for (const [index, { x, y }] of positions.entries()) {
    path += `${index === 0 ? "M" : "L"}${String(hundredthsOf(x))} ${String(hundredthsOf(y))}`;
  }
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      overflow="visible"
    >
      {area && positions.length > 1 && (
        <>
          <defs>
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0"
                stopColor="var(--line-color)"
                stopOpacity="0.18"
              />
              <stop offset="1" stopColor="var(--line-color)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${path}L100 100L0 100Z`}
            className={styles["areaFill"]}
            fill={`url(#${areaId})`}
          />
        </>
      )}
      <path d={path} className={className} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
