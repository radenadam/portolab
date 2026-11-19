import type { ReactNode } from "react";
import type { PlacedMark } from "./layout-risk-map";
import { percentOf } from "./plot";
import styles from "./risk-map.module.css";

// The head of an arrow stands this far beside the mark that it points at, and it is this wide, in sizes of the text of the labels.
const headGap = 0.4;
const headWidth = 1.5;

/** How far beyond the edge of the mark that an arrow points at its head reaches, which the labels of a map keep clear of as of a mark. */
export const arrowHeadReach = headGap + headWidth / 2;

export function MapArrow({
  from,
  to,
}: {
  from: PlacedMark;
  to: PlacedMark | undefined;
}): ReactNode {
  if (to === undefined) return null;
  if (from.position.x === to.position.x && from.position.y === to.position.y)
    return null;
  return (
    <g className={styles["arrow"]}>
      <line
        x1={percentOf(from.position.x)}
        y1={percentOf(from.position.y)}
        x2={percentOf(to.position.x)}
        y2={percentOf(to.position.y)}
        data-map-line=""
      />
      <svg
        x={percentOf(to.position.x)}
        y={percentOf(to.position.y)}
        overflow="visible"
      >
        <svg
          x={`${String((from.position.x < to.position.x ? -1 : 1) * (to.outerRadius + headGap) - headWidth / 2)}em`}
          y="-0.5em"
          width={`${String(headWidth)}em`}
          height="1em"
          viewBox="-0.75 -0.5 1.5 1"
        >
          <path
            data-map-line=""
            vectorEffect="non-scaling-stroke"
            d="M 0.6 -0.35 L 0 0 L 0.6 0.35"
            transform={
              from.position.x < to.position.x ? "rotate(180)" : undefined
            }
          />
        </svg>
      </svg>
    </g>
  );
}
