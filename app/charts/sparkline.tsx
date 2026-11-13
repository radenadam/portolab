import type { ReactNode } from "react";
import type { ChangeDirection } from "~/formatting";
import { plotFraction } from "~/units/plot-fraction";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { percentOf, PlotLine } from "./plot";
import { fractionOf } from "./scale";
import styles from "./sparkline.module.css";

const directionClasses: Record<ChangeDirection, string | undefined> = {
  rise: styles["rise"],
  fall: styles["fall"],
  none: styles["flat"],
};

// The radius of the dot on the latest close, in sizes of the text around the line. The line keeps as much room around it, so the dot never overflows the cell that holds the line.
const dotRadius = 0.2;

/** A small line of the closes of a stock over a period, such as its last month, with a dot on the latest close, as decision 0029 sets. It is green when the latest close is above the first, red when it is below, and muted when they are equal, and its shape shows the same rise or fall to a reader who cannot tell the colors apart. Screen readers skip it, so the text beside it carries what it shows. It draws nothing for fewer than two closes, which show no change. */
export function Sparkline({
  closes,
}: {
  closes: readonly SplitAdjustedRupiah[];
}): ReactNode {
  const first = closes[0];
  const latest = closes.at(-1);
  if (closes.length < 2 || first === undefined || latest === undefined) {
    return null;
  }
  const range = {
    min: splitAdjustedRupiah(Math.min(...closes)),
    max: splitAdjustedRupiah(Math.max(...closes)),
  };
  const positions = closes.map((close, index) => ({
    x: plotFraction(index / (closes.length - 1)),
    // Closes that never changed run through the middle.
    y: plotFraction(range.max > range.min ? 1 - fractionOf(range, close) : 0.5),
  }));
  const end = positions[positions.length - 1];
  return (
    <svg
      className={directionClasses[directionOf(first, latest)]}
      style={{ padding: `${String(dotRadius)}em` }}
      aria-hidden
    >
      <PlotLine positions={positions} className={styles["line"]} />
      {end !== undefined && (
        <circle
          cx={percentOf(end.x)}
          cy={percentOf(end.y)}
          r={`${String(dotRadius)}em`}
          className={styles["dot"]}
        />
      )}
    </svg>
  );
}

function directionOf(
  first: SplitAdjustedRupiah,
  latest: SplitAdjustedRupiah,
): ChangeDirection {
  if (latest > first) {
    return "rise";
  }
  return latest < first ? "fall" : "none";
}
