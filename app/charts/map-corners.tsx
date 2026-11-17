import type { ReactNode } from "react";
import { plotFraction } from "~/units/plot-fraction";
import { MapLabel } from "./map-label";
import { mapLineLabelKeys } from "./map-label-text";
import type { MapLabels, PlacedLabels } from "./map-labels";
import styles from "./risk-map.module.css";

interface CornerText {
  text: string;
  wideText: string;
}

export type MapCornersText = readonly [
  CornerText,
  CornerText,
  CornerText,
  CornerText,
];

export function mapCornerLabels(corners: MapCornersText): MapLabels["lines"] {
  return corners.map((corner, index) => ({
    key: mapLineLabelKeys.corners[index] ?? "",
    text: corner.text,
    wideText: corner.wideText,
    places: [
      {
        at: { x: plotFraction(index % 2), y: plotFraction(index < 2 ? 0 : 1) },
        dx: index % 2 === 0 ? 0.25 : -0.25,
        dy: index < 2 ? 1.25 : -0.5,
        anchor: index % 2 === 0 ? "start" : "end",
      },
    ],
  }));
}

export function MapCorners({
  corners,
  placed,
}: {
  corners: MapCornersText;
  placed: PlacedLabels;
}): ReactNode {
  return corners.map((corner, index) => {
    const key = mapLineLabelKeys.corners[index] ?? "";
    return (
      <MapLabel
        key={key}
        text={placed.wideLines.has(key) ? corner.wideText : corner.text}
        place={placed.lines.get(key)}
        className={styles["corner"]}
      />
    );
  });
}
