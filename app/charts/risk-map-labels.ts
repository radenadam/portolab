import { plotFraction } from "~/units/plot-fraction";
import type { RiskMapLayout } from "./layout-risk-map";
import type { MapLabels } from "./map-labels";
import { mapLineLabelKeys, mapPointName } from "./map-label-text";
import type { DrawnPoint, MarkKind } from "./map-drawing";

/** The texts of the class map that label its distribution and corners. */
export interface MapSpreadText {
  zeroLabel: string;
  medianLabel: string;
  corners: readonly [string, string, string, string];
}

// The portfolio and every holding keep their names ahead of every other point, even when the caller lists the holdings before the portfolio. Larger marks leave less room for their names, so they take their places before smaller marks of the same kind.
const labelOrder: Record<MarkKind, number> = {
  own: 0,
  held: 1,
  market: 2,
  active: 3,
  other: 4,
};

/** The labels of the map in the order in which they take their places: the names of the points of the reader, the labels of the lines, and then the names of the other points by labelOrder. */
export function riskMapLabels(
  drawn: readonly DrawnPoint[],
  map: {
    line: { name: string } | undefined;
    levelLabel: string;
    layout: RiskMapLayout<unknown>;
    spread: MapSpreadText | undefined;
  },
): MapLabels {
  const kept: { key: string; text: string }[] = [];
  const others: { key: string; text: string }[] = [];
  for (const { point, kind } of drawn.toSorted(
    (first, second) =>
      labelOrder[first.kind] - labelOrder[second.kind] ||
      second.placed.outerRadius - first.placed.outerRadius,
  )) {
    const label = { key: point.key, text: mapPointName({ point, kind }) };
    if (label.text.length === 0) continue;
    switch (kind) {
      case "own":
      case "held":
        kept.push(label);
        break;
      case "market":
      case "active":
      case "other":
        others.push(label);
        break;
    }
  }
  const extraLines = spreadLabels(map);
  return {
    kept,
    lines: [
      {
        key: mapLineLabelKeys.level,
        text: map.levelLabel,
        places: map.layout.linePlaces.level,
      },
      ...extraLines,
      ...(map.line === undefined
        ? []
        : [
            {
              key: mapLineLabelKeys.line,
              text: map.line.name,
              places: map.layout.linePlaces.line,
            },
          ]),
    ],
    others,
  };
}

function spreadLabels(map: {
  layout: RiskMapLayout<unknown>;
  spread: MapSpreadText | undefined;
}): MapLabels["lines"] {
  const extraLines: MapLabels["lines"][number][] = [];
  if (map.spread !== undefined) {
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
            dy: index < 2 ? 1.5 : -0.75,
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
        ],
      });
  }
  return extraLines;
}
