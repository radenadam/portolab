import type { ReactNode } from "react";
import type { RiskMapLayout } from "./layout-risk-map";
import { percentOf } from "./plot";
import { distributionOf } from "./distribution-of";
import styles from "./risk-map.module.css";

const barReach = 2.3;
const barRadius = "0.15em";
const binSpan = "98%";

/** The distribution shares the plot so a lecturer need not compare two separate histograms. */
export function MapSpread({
  layout,
}: {
  layout: RiskMapLayout<unknown>;
}): ReactNode {
  const horizontal = distributionOf(
    layout.points.map(({ placed }) => placed.position.x),
  );
  const vertical = distributionOf(
    layout.points.map(({ placed }) => placed.position.y),
  );
  return (
    <>
      {horizontal.map(({ at, width, share }) => (
        <svg
          key={at}
          x={percentOf(at)}
          y="0"
          width={percentOf(width)}
          height="1"
          overflow="visible"
        >
          <rect
            x="0"
            y={`${String(-0.5 - share * barReach)}em`}
            width={binSpan}
            height={`${String(share * barReach)}em`}
            rx={barRadius}
            className={styles["distribution"]}
          />
        </svg>
      ))}
      {vertical.map(({ at, width, share }) => (
        <svg
          key={at}
          x="100%"
          y={percentOf(at)}
          width="1"
          height={percentOf(width)}
          overflow="visible"
        >
          <rect
            x="0.65em"
            y="0"
            width={`${String(share * barReach)}em`}
            height={binSpan}
            rx={barRadius}
            className={styles["distribution"]}
          />
        </svg>
      ))}
    </>
  );
}
