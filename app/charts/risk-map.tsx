import { useMemo } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { useChartSlider } from "./use-chart-slider";
import { layoutRiskMap } from "./layout-risk-map";
import type {
  MapAxis,
  MapLine,
  MapPoint,
  MapValue,
  MarkedPoint,
  RiskMapLayout,
} from "./layout-risk-map";
import { lineLabelKeys, MapDrawing, markReach } from "./map-drawing";
import type { DrawnPoint, MarkKind } from "./map-drawing";
import type { MapLabels } from "./map-labels";
import { keptNameRoom } from "./map-labels";
import { valueMarkGap } from "./value-mark";
import styles from "./risk-map.module.css";
import { tipAcross, tipDown } from "./tip-placement";
import { useIsInBrowser } from "./use-is-in-browser";
import { useMapLabels } from "./use-map-labels";

// The portfolio and every holding keep their names ahead of every other point, even when the caller lists the holdings before the portfolio. Larger marks leave less room for their names, so they take their places before smaller marks of the same kind.
const labelOrder: Record<MarkKind, number> = {
  own: 0,
  held: 1,
  market: 2,
  other: 3,
};

// Every length around the plot is a multiple of the size of the text of its marks, so the map keeps its proportions when a reader enlarges the text.
const bottomRoom = 3.5;
const sideRoom = 0.5;
// A point answers a pointer or a finger within this distance of its center, in sizes of the text of the labels, or within the reach of its mark when that is larger.
const pointerReach = 0.83;

/** A map of risk across against return up, as decisions 0028 and 0035 set: each point by its mark and its name, the IHSG as a diamond with a strong line through its risk and a dashed line at its return, and a line from a point through the IHSG, such as the security market line. The server draws it in SVG and places its labels from estimated widths of their texts. Once JavaScript runs, the browser places the labels again from their measured widths at the size of the plot, and the plot is a slider that a pointer, a finger, or the keys move over the points in the order of their risk, which shows the values of the marked point in a tooltip. */
export function RiskMap<Across extends number, Up extends number>({
  market,
  points,
  across,
  up,
  line,
  levelLabel,
  labelledBy,
}: {
  /** The IHSG. */
  market: MapPoint<Across, Up>;
  points: readonly MarkedPoint<Across, Up>[];
  across: MapAxis<Across> & {
    /** The name of the axis, which the map writes below its right end. */
    title: string;
  };
  up: MapAxis<Up>;
  line: MapLine<Across, Up>;
  /** The label of the line at the return of the IHSG, such as IHSG 0.70%. */
  levelLabel: string;
  /** The id of the heading that names the map, which also names its slider. */
  labelledBy: string;
}): ReactNode {
  const isInBrowser = useIsInBrowser();
  const layout = useMemo(
    () => layoutRiskMap({ market, points, across, up, line }),
    [market, points, across, up, line],
  );
  const drawn = useMemo(() => drawnPoints(market, layout), [market, layout]);
  const labels = useMemo(
    () => mapLabels(drawn, { line, levelLabel, layout }),
    [drawn, line, levelLabel, layout],
  );
  const marks = useMemo(
    () =>
      drawn.map(({ point, placed }) => ({
        key: point.key,
        position: placed.position,
        outerRadius: placed.outerRadius,
      })),
    [drawn],
  );
  const { placed, areaRef, drawingRef, measureRef, textSize } = useMapLabels(
    labels,
    marks,
  );
  const stops = useMemo(
    () =>
      drawn.toSorted(
        (first, second) =>
          first.point.across - second.point.across ||
          first.point.up - second.point.up,
      ),
    [drawn],
  );
  const ownStop = stops.findIndex((stop) => stop.kind === "own");
  const slider = useChartSlider({
    count: stops.length,
    resting:
      ownStop === -1
        ? stops.findIndex((stop) => stop.kind === "market")
        : ownStop,
    labelledBy,
  });
  const style: CSSProperties = {
    paddingBlock: `${String(sideRoom)}em ${String(bottomRoom)}em`,
    paddingInline: `calc(${String(layout.upTextLength)}ch + ${String(valueMarkGap)}em + ${String(keptNameRoom)} * var(--text-small)) ${String(sideRoom)}em`,
  };
  const active = slider.marked === undefined ? undefined : stops[slider.marked];
  const drawing = (
    <MapDrawing
      layout={layout}
      drawn={drawn}
      placed={placed}
      texts={{ title: across.title, level: levelLabel, line: line.name }}
      active={active}
      drawingRef={drawingRef}
      measureRef={measureRef}
    />
  );
  const shown = stops[slider.shown];
  if (!isInBrowser || shown === undefined) {
    return (
      <div className={styles["riskMap"]}>
        <div className={styles["plot"]} style={style}>
          <div ref={areaRef} className={styles["area"]}>
            {drawing}
          </div>
        </div>
      </div>
    );
  }
  const markPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const area = areaRef.current;
    const size = textSize();
    if (area !== null && size !== undefined) {
      slider.setMarked(nearestStop(stops, { event, area, textSize: size }));
    }
  };
  return (
    <div className={styles["riskMap"]}>
      <div
        className={styles["plot"]}
        style={style}
        {...slider.sliderProps(spokenPoint(shown.point))}
        onPointerDown={markPointer}
        onPointerMove={markPointer}
      >
        <div ref={areaRef} className={styles["area"]}>
          {drawing}
          {active !== undefined && <MapTip drawn={active} />}
        </div>
      </div>
    </div>
  );
}

/** The IHSG and every other point with the kind of its mark, in the order of the points after the IHSG. */
function drawnPoints<Across extends number, Up extends number>(
  market: MapPoint<Across, Up>,
  layout: RiskMapLayout<MarkedPoint<Across, Up>>,
): DrawnPoint[] {
  return [
    { point: market, kind: "market", placed: layout.market },
    ...layout.points.map(({ point, placed }) => ({
      point,
      kind: point.mark.kind,
      placed,
    })),
  ];
}

/** The labels of the map in the order in which they take their places: the names of the points of the reader, the labels of the lines, and then the names of the other points by labelOrder. */
function mapLabels(
  drawn: readonly DrawnPoint[],
  map: {
    line: { name: string };
    levelLabel: string;
    layout: RiskMapLayout<unknown>;
  },
): MapLabels {
  const kept: { key: string; text: string }[] = [];
  const others: { key: string; text: string }[] = [];
  for (const { point, kind } of drawn.toSorted(
    (first, second) =>
      labelOrder[first.kind] - labelOrder[second.kind] ||
      second.placed.outerRadius - first.placed.outerRadius,
  )) {
    const label = { key: point.key, text: point.name };
    switch (kind) {
      case "own":
      case "held":
        kept.push(label);
        break;
      case "market":
      case "other":
        others.push(label);
        break;
    }
  }
  return {
    kept,
    lines: [
      {
        key: lineLabelKeys.level,
        text: map.levelLabel,
        places: map.layout.linePlaces.level,
      },
      {
        key: lineLabelKeys.line,
        text: map.line.name,
        places: map.layout.linePlaces.line,
      },
    ],
    others,
  };
}

/** The index of the point nearest to a pointer or a finger among the points within its reach, or undefined when none is. */
function nearestStop(
  stops: readonly DrawnPoint[],
  pointer: {
    event: PointerEvent<HTMLDivElement>;
    area: HTMLDivElement;
    textSize: number;
  },
): number | undefined {
  const box = pointer.area.getBoundingClientRect();
  let nearest: { index: number; distance: number } | undefined;
  for (const [index, { placed }] of stops.entries()) {
    const distance =
      Math.hypot(
        placed.position.x * box.width - (pointer.event.clientX - box.left),
        placed.position.y * box.height - (pointer.event.clientY - box.top),
      ) / pointer.textSize;
    const reach = Math.max(pointerReach, placed.outerRadius + markReach);
    if (
      distance <= reach &&
      (nearest === undefined || distance < nearest.distance)
    ) {
      nearest = { index, distance };
    }
  }
  return nearest?.index;
}

/** The tooltip of a marked point: its name and each of its values, beside the point and toward the larger part of the plot. */
function MapTip({ drawn }: { drawn: DrawnPoint }): ReactNode {
  return (
    <div
      className={styles["tip"]}
      style={{
        ...tipAcross(drawn.placed.position.x),
        ...tipDown(drawn.placed.position.y),
      }}
    >
      <p className={styles["tipName"]}>{drawn.point.name}</p>
      {drawn.point.values.map(({ name, value }) => (
        <p key={name} className={styles["tipValue"]}>
          <span>{name}</span>
          <span className={styles["tipNumber"]}>
            <ValueText value={value} />
          </span>
        </p>
      ))}
    </div>
  );
}

function ValueText({ value }: { value: MapValue["value"] }): ReactNode {
  return typeof value === "string" ? value : <ChangeText change={value} />;
}

/** The text of a point that a screen reader reads as the value of the slider, such as BBCA: Beta terhadap IHSG 0,69 dan Imbal hasil yang diharapkan -0,10%. */
function spokenPoint(point: MapPoint<number, number>): string {
  return m.app_map_point_label({
    name: point.name,
    values: formatList(
      point.values.map(({ name, value }) =>
        m.app_map_value_part({
          name,
          value: typeof value === "string" ? value : value.text,
        }),
      ),
      "conjunction",
    ),
  });
}
