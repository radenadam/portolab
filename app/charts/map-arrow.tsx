import type { ReactNode } from "react";
import type { PlacedMark } from "./layout-risk-map";
import { percentOf } from "./plot";
import styles from "./risk-map.module.css";

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
      />
      <svg
        x={percentOf(to.position.x)}
        y={percentOf(to.position.y)}
        overflow="visible"
      >
        <svg
          x={`${String((from.position.x < to.position.x ? -1 : 1) * (to.outerRadius + 0.4) - 0.75)}em`}
          y="-0.5em"
          width="1.5em"
          height="1em"
          viewBox="-0.75 -0.5 1.5 1"
        >
          <path
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
