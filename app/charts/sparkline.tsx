import { directionOf } from "./direction-of";
import type { ReactNode } from "react";
import type { ChangeDirection } from "~/formatting";
import { plotFraction } from "~/units/plot-fraction";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { IndexPoints } from "~/units/index-points";
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

export const minimumSparklineCloses = 2;

/** A small line of the closes of a stock or of the IHSG over a period, such as its last month, with a dot on the latest close, as decision 0029 sets. It is green when the latest close is above the first, red when it is below, and muted when they are equal, each at the precision that the reader sees for its unit, and its shape shows the same rise or fall to a reader who cannot tell the colors apart. Screen readers skip it, so the text beside it carries what it shows. It draws nothing for fewer than two closes, which show no change. */
export function Sparkline(
  prices:
    | { kind?: "stock"; closes: readonly SplitAdjustedRupiah[] }
    | { kind: "index"; closes: readonly IndexPoints[] },
): ReactNode {
  if (prices.kind === "index")
    return (
      <SparklineDrawing<IndexPoints>
        closes={prices.closes}
        direction={(first, latest) => directionOf(first, latest, "index")}
      />
    );
  return (
    <SparklineDrawing<SplitAdjustedRupiah>
      closes={prices.closes}
      direction={(first, latest) => directionOf(first, latest)}
    />
  );
}

function SparklineDrawing<Close extends number>({
  closes,
  direction,
}: {
  closes: readonly Close[];
  direction: (first: Close, latest: Close) => ChangeDirection;
}): ReactNode {
  const first = closes[0];
  const latest = closes.at(-1);
  if (
    closes.length < minimumSparklineCloses ||
    first === undefined ||
    latest === undefined
  ) {
    return null;
  }
  let minimum: Close = first;
  let maximum: Close = first;
  for (const close of closes) {
    if (close < minimum) minimum = close;
    if (close > maximum) maximum = close;
  }
  const range = { min: minimum, max: maximum };
  const positions = closes.map((close, index) => ({
    x: plotFraction(index / (closes.length - 1)),
    // Closes that never changed run through the middle.
    y: plotFraction(range.max > range.min ? 1 - fractionOf(range, close) : 0.5),
  }));
  const end = positions[positions.length - 1];
  return (
    <svg
      className={directionClasses[direction(first, latest)]}
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
