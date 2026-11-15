import type { ReactNode } from "react";
import type { PlacedMark } from "./layout-risk-map";
import { emOf, percentOf } from "./plot";
import styles from "./risk-map.module.css";

/** The diamond of the IHSG. A path cannot place a corner at a position of the plot plus a length in sizes of the text, so an inner drawing stands at the position of the IHSG, and the diamond fills a drawing of its own size around that position. */
export function MapDiamond({ placed }: { placed: PlacedMark }): ReactNode {
  const size = emOf(2 * placed.radius);
  return (
    <svg
      x={percentOf(placed.position.x)}
      y={percentOf(placed.position.y)}
      overflow="visible"
    >
      <svg
        x={emOf(-placed.radius)}
        y={emOf(-placed.radius)}
        width={size}
        height={size}
        viewBox="-1 -1 2 2"
        overflow="visible"
      >
        <path
          d="M0 -1L1 0L0 1L-1 0Z"
          vectorEffect="non-scaling-stroke"
          className={styles["market"]}
        />
      </svg>
    </svg>
  );
}
