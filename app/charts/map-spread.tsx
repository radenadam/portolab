import { MapCorners, mapCornerLabels } from "./map-corners";
import type { MapCornersText } from "./map-corners";
import { plotFraction } from "~/units/plot-fraction";
import type { MapLabels, PlacedLabels } from "./map-labels";
import { mapLineLabelKeys } from "./map-label-text";
import { MapLabel } from "./map-label";
import type { ReactNode } from "react";
import type { RiskMapLayout } from "./layout-risk-map";
import { percentOf } from "./plot";
import styles from "./risk-map.module.css";

/** The texts of the class map that label its line of zero, its median, and its corners. */
interface MapSpreadText {
  zeroLabel: string;
  medianLabel: string;
  corners: MapCornersText;
}

/** Class-only decorations stay with the route that imports them, so a trade map carries no drawing of the median of a class. */
export function mapSpread<Up extends number>({
  median,
  ...spread
}: MapSpreadText & { median: Up | undefined }) {
  return {
    median,
    labels: (layout: RiskMapLayout<unknown>) =>
      spreadLabels({ layout, spread }),
    drawing: (layout: RiskMapLayout<unknown>, placed: PlacedLabels) => (
      <SpreadDrawing layout={layout} placed={placed} spread={spread} />
    ),
  };
}

function SpreadDrawing({
  layout,
  placed,
  spread,
}: {
  layout: RiskMapLayout<unknown>;
  placed: PlacedLabels;
  spread: MapSpreadText;
}): ReactNode {
  return (
    <>
      {layout.median !== undefined && (
        <line
          x1="0%"
          x2="100%"
          y1={percentOf(layout.median)}
          y2={percentOf(layout.median)}
          className={styles["medianLine"]}
          data-map-line=""
        />
      )}
      <MapLabel
        text={spread.zeroLabel}
        place={placed.lines.get(mapLineLabelKeys.zero)}
        className={styles["corner"]}
      />
      <MapLabel
        text={spread.medianLabel}
        place={placed.lines.get(mapLineLabelKeys.median)}
        className={styles["medianLabel"]}
      />
      <MapCorners corners={spread.corners} placed={placed} />
    </>
  );
}

function spreadLabels(map: {
  layout: RiskMapLayout<unknown>;
  spread: MapSpreadText;
}): MapLabels["lines"] {
  const extraLines: MapLabels["lines"][number][] = [];
  extraLines.push(...mapCornerLabels(map.spread.corners));
  extraLines.push({
    key: mapLineLabelKeys.zero,
    text: map.spread.zeroLabel,
    places: map.layout.linePlaces.level.map((place) => ({
      ...place,
      at: { ...place.at, y: map.layout.zero },
    })),
  });
  if (map.layout.median !== undefined)
    extraLines.push({
      key: mapLineLabelKeys.median,
      text: map.spread.medianLabel,
      places: [
        {
          at: { x: plotFraction(1), y: map.layout.median },
          dx: -0.25,
          dy: -0.5,
          anchor: "end",
        },
        {
          at: { x: plotFraction(1), y: map.layout.median },
          dx: -0.25,
          dy: 1.33,
          anchor: "end",
        },
        {
          at: { x: plotFraction(1), y: map.layout.median },
          dx: -0.25,
          dy: -1.67,
          anchor: "end",
        },
        {
          at: { x: plotFraction(1), y: map.layout.median },
          dx: -0.25,
          dy: 2.33,
          anchor: "end",
        },
      ],
    });
  return extraLines;
}
