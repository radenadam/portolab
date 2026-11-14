import type { ReactNode } from "react";
import type { LabelPlace } from "./map-labels";
import { emOf, percentOf } from "./plot";
import styles from "./risk-map.module.css";

export function MapLabel({
  text,
  value,
  place,
  className,
  kind = "fixed",
}: {
  text: string | undefined;
  value?: string | undefined;
  place: LabelPlace | undefined;
  className: string | undefined;
  kind?: "fixed" | "point";
}): ReactNode {
  if (place === undefined || text === undefined) {
    return null;
  }
  return (
    <text
      x={percentOf(place.at.x)}
      y={percentOf(place.at.y)}
      dx={emOf(place.dx)}
      dy={emOf(place.dy)}
      textAnchor={place.anchor}
      data-map-label={kind}
    >
      {/* The offsets use the drawing's text size, while the letters may use a smaller font. */}
      <tspan className={className}>
        {text}
        {value !== undefined && (
          <tspan className={styles["labelValue"]}> {value}</tspan>
        )}
      </tspan>
    </text>
  );
}
