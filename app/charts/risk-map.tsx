import { nearestMapStop } from "./nearest-map-stop";
import { MapTip } from "./map-tip";
import { MapPointActions } from "./map-point-actions";
import { useMemo } from "react";
import type { CSSProperties, PointerEvent, MouseEvent, ReactNode } from "react";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { useChartSlider } from "./use-chart-slider";
import { layoutRiskMap } from "./layout-risk-map";
import type {
  MapAxis,
  MapAcrossAxis,
  MapLine,
  MapPoint,
  MarkedPoint,
  RiskMapLayout,
} from "./layout-risk-map";
import { lineLabelKeys, MapDrawing } from "./map-drawing";
import type { DrawnPoint, MarkKind } from "./map-drawing";
import type { MapLabels } from "./map-labels";
import { keptNameRoom } from "./map-labels";
import { valueMarkGap } from "./value-mark";
import styles from "./risk-map.module.css";
import { useIsInBrowser } from "~/use-is-in-browser";
import { useMapLabels } from "./use-map-labels";

// The portfolio and every holding keep their names ahead of every other point, even when the caller lists the holdings before the portfolio. Larger marks leave less room for their names, so they take their places before smaller marks of the same kind.
const labelOrder: Record<MarkKind, number> = {
  own: 0,
  held: 1,
  market: 2,
  other: 3,
  average: 2,
  classmate: 4,
};

// Every length around the plot is a multiple of the size of the text of its marks, so the map keeps its proportions when a reader enlarges the text.
const bottomRoom = 3.5;
const sideRoom = 0.5;
/** The server's estimated label widths keep names visible before the browser can measure them. */
export function RiskMap<Across extends number, Up extends number>({
  market,
  points,
  across,
  up,
  line,
  levelLabel,
  labelledBy,
  fill = false,
}: {
  /** The IHSG. */
  market: MapPoint<Across, Up>;
  points: readonly MarkedPoint<Across, Up>[];
  across: MapAcrossAxis<Across> & {
    /** The name of the axis, which the map writes below its right end. */
    title: string;
  };
  up: MapAxis<Up>;
  line?: MapLine<Across, Up>;
  /** The label of the line at the return of the IHSG, such as IHSG 0.70%. */
  levelLabel?: string;
  /** The id of the heading that names the map, which also names its slider. */
  labelledBy: string;
  fill?: boolean;
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
      texts={{ title: across.title, level: levelLabel, line: line?.name }}
      active={active}
      drawingRef={drawingRef}
      measureRef={measureRef}
    />
  );
  const shown = stops[slider.shown];
  const activatePoint = (event: MouseEvent<HTMLButtonElement>): void => {
    if (event.detail === 0) return;
    const area = areaRef.current;
    const size = textSize();
    if (area === null || size === undefined) return;
    const nearest = nearestMapStop(stops, { event, area, textSize: size });
    const popover =
      nearest === undefined ? undefined : stops[nearest]?.point.popover;
    if (popover !== undefined) {
      event.preventDefault();
      document
        .getElementById(popover)
        ?.showPopover({ source: event.currentTarget });
    }
  };
  const actions = (
    <MapPointActions drawn={drawn} style={style} onActivate={activatePoint} />
  );
  if (!isInBrowser || shown === undefined) {
    return (
      <div
        className={[styles["riskMap"], fill ? styles["fill"] : ""].join(" ")}
      >
        <div className={styles["plot"]} style={style}>
          <div ref={areaRef} className={styles["area"]}>
            {drawing}
          </div>
        </div>
        {actions}
      </div>
    );
  }
  const markPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const area = areaRef.current;
    const size = textSize();
    if (area !== null && size !== undefined) {
      slider.setMarked(nearestMapStop(stops, { event, area, textSize: size }));
    }
  };
  const sliderProps = slider.sliderProps(spokenPoint(shown.point));
  return (
    <div
      className={[styles["riskMap"], fill ? styles["fill"] : ""].join(" ")}
      onPointerDown={markPointer}
      onPointerMove={markPointer}
      onPointerLeave={sliderProps.onPointerLeave}
    >
      <div
        className={styles["plot"]}
        style={style}
        {...sliderProps}
        role="slider"
        tabIndex={0}
        aria-valuenow={slider.shown}
        onKeyDown={(event) => {
          sliderProps.onKeyDown?.(event);
          if (
            (event.key === "Enter" || event.key === " ") &&
            shown.point.popover !== undefined
          ) {
            event.preventDefault();
            document
              .getElementById(shown.point.popover)
              ?.showPopover({ source: event.currentTarget });
          }
        }}
        onPointerLeave={undefined}
      >
        <div ref={areaRef} className={styles["area"]}>
          {drawing}
          {active !== undefined && <MapTip drawn={active} />}
        </div>
      </div>
      {actions}
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
    line: { name: string } | undefined;
    levelLabel: string | undefined;
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
    const label = { key: point.key, text: point.name, value: point.labelValue };
    switch (kind) {
      case "own":
      case "held":
      case "average":
        kept.push(label);
        break;
      case "market":
      case "other":
        others.push(label);
        break;
      case "classmate":
        break;
    }
  }
  return {
    kept,
    lines: [
      ...(map.levelLabel === undefined
        ? []
        : [
            {
              key: lineLabelKeys.level,
              text: map.levelLabel,
              places: map.layout.linePlaces.level,
            },
          ]),
      ...(map.line === undefined
        ? []
        : [
            {
              key: lineLabelKeys.line,
              text: map.line.name,
              places: map.layout.linePlaces.line,
            },
          ]),
    ],
    others,
  };
}

/** The text of a point that a screen reader reads as the value of the slider, such as BBCA: Beta terhadap IHSG 0,69 dan Imbal hasil harapan -0,10%. */
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
