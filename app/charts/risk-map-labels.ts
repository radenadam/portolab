import type { RiskMapLayout } from "./layout-risk-map";
import type { MapLabels } from "./map-labels";
import { mapLineLabelKeys, mapPointName } from "./map-label-text";
import type { DrawnPoint, MarkKind } from "./map-drawing";

interface MapTextContext {
  line: { name: string } | undefined;
  levelLabel: string | undefined;
  layout: RiskMapLayout<unknown>;
  extraLines: MapLabels["lines"];
}

// The portfolio and every holding keep their names ahead of every other point, even when the caller lists the holdings before the portfolio. Larger marks leave less room for their names, so they take their places before smaller marks of the same kind.
const labelOrder: Record<MarkKind, number> = {
  own: 0,
  before: 0,
  held: 1,
  market: 2,
  average: 2,
  active: 3,
  other: 4,
  classmate: 5,
};

/** The labels of the map in the order in which they take their places: the names of the points of the reader, the fixed labels, and then the names of the other points by labelOrder. */
export function riskMapLabels(
  drawn: readonly DrawnPoint[],
  map: MapTextContext,
): MapLabels {
  const kept: { key: string; text: string; value: string | undefined }[] = [];
  const others: { key: string; text: string; value: string | undefined }[] = [];
  for (const { point, kind } of drawn.toSorted(
    (first, second) =>
      labelOrder[first.kind] - labelOrder[second.kind] ||
      second.placed.outerRadius - first.placed.outerRadius,
  )) {
    const label = {
      key: point.key,
      text: mapPointName({ point, kind }),
      value: point.labelValue,
    };
    if (label.text.length === 0) continue;
    switch (kind) {
      case "classmate":
        break;
      case "own":
      case "before":
      case "held":
      case "average":
        kept.push(label);
        break;
      case "market":
      case "active":
      case "other":
        others.push(label);
        break;
    }
  }
  return {
    kept,
    lines: fixedLabels(map),
    others,
  };
}

function fixedLabels(map: MapTextContext): MapLabels["lines"] {
  return [
    ...(map.levelLabel === undefined
      ? []
      : [
          {
            key: mapLineLabelKeys.level,
            text: map.levelLabel,
            places: map.layout.linePlaces.level,
          },
        ]),
    ...map.extraLines,
    ...(map.line === undefined
      ? []
      : [
          {
            key: mapLineLabelKeys.line,
            text: map.line.name,
            places: map.layout.linePlaces.line,
          },
        ]),
  ];
}
