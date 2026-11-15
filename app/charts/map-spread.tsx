import { plotFraction } from "~/units/plot-fraction";
import type { MapLabels, PlacedLabels } from "./map-labels";
import { mapLineLabelKeys } from "./map-label-text";
import { MapLabel } from "./map-label";
import type { ReactNode } from "react";
import type { RiskMapLayout } from "./layout-risk-map";
import { percentOf } from "./plot";
import { distributionOf } from "./distribution-of";
import styles from "./risk-map.module.css";

const barReach = 2.3;
const barRadius = "0.15em";
const binSpan = "98%";

/** The distribution shares the plot so a lecturer need not compare two separate histograms. */
function MapSpread({ layout }: { layout: RiskMapLayout<unknown> }): ReactNode {
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

/** The texts of the class map that label its distribution and corners. */
interface MapSpreadText {
  zeroLabel: string;
  medianLabel: string;
  corners: readonly [string, string, string, string];
}

/** Class-only decorations stay with the route that imports them, so a trade map carries no distribution drawing. */
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
      <MapSpread layout={layout} />
      {layout.median !== undefined && (
        <line
          x1="86%"
          x2="100%"
          y1={percentOf(layout.median)}
          y2={percentOf(layout.median)}
          className={styles["line"]}
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
      {spread.corners.map((text, index) => (
        <MapLabel
          key={text}
          text={text}
          place={placed.lines.get(mapLineLabelKeys.corners[index] ?? "")}
          className={styles["corner"]}
        />
      ))}
    </>
  );
}

function spreadLabels(map: {
  layout: RiskMapLayout<unknown>;
  spread: MapSpreadText;
}): MapLabels["lines"] {
  const extraLines: MapLabels["lines"][number][] = [];
  for (const [index, text] of map.spread.corners.entries()) {
    extraLines.push({
      key: mapLineLabelKeys.corners[index] ?? "",
      text,
      places: [
        {
          at: {
            x: plotFraction(index % 2),
            y: plotFraction(index < 2 ? 0 : 1),
          },
          dx: index % 2 === 0 ? 0.25 : -0.25,
          dy: index < 2 ? 1.25 : -0.5,
          anchor: index % 2 === 0 ? "start" : "end",
        },
      ],
    });
  }
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
