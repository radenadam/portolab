import { nearestMapStop } from "./nearest-map-stop";
import { MapTip } from "./map-tip";
import { MapPointActions } from "./map-point-actions";
import { useMemo } from "react";
import { useNavigate } from "react-router";
import type { CSSProperties, PointerEvent, MouseEvent, ReactNode } from "react";
import { formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { useChartSlider } from "./use-chart-slider";
import { layoutRiskMap } from "./layout-risk-map";
import type {
  MapAxis,
  MapLine,
  MapPoint,
  MarkedPoint,
  RiskMapLayout,
} from "./layout-risk-map";
import { MapDrawing, markReach } from "./map-drawing";
import type { DrawnPoint } from "./map-drawing";
import { riskMapLabels } from "./risk-map-labels";
import type { MapSpreadText } from "./risk-map-labels";
import { keptNameRoom } from "./map-labels";
import { valueMarkGap } from "./value-mark";
import styles from "./risk-map.module.css";
import { useIsInBrowser } from "~/use-is-in-browser";
import { useMapLabels } from "./use-map-labels";

// Every length around the plot is a multiple of the size of the text of its marks, so the map keeps its proportions when a reader enlarges the text.
const bottomRoom = 3.5;
const sideRoom = 0.5;
const spreadRoom = 3.5;
/** A map of risk across against return up, as decisions 0028 and 0035 set: each point by its mark and its name, the IHSG as a diamond with a strong line through its risk and a dashed line at its return, and an optional line from a point through the IHSG, such as the security market line. The server draws it in SVG and places its labels from estimated widths of their texts. Once JavaScript runs, the browser places the labels again from their measured widths at the size of the plot, and the plot is a slider that a pointer, a finger, or the keys move over the points in the order of their risk, which shows the values of the marked point in a tooltip. */
export function RiskMap<Across extends number, Up extends number>({
  market,
  points,
  across,
  up,
  line,
  levelLabel,
  labelledBy,
  spread,
  coloredValues,
  fill = false,
  compact = false,
}: {
  /** The IHSG. */
  market: MapPoint<Across, Up>;
  points: readonly MarkedPoint<Across, Up>[];
  across: MapAxis<Across> & {
    /** The name of the axis, which the map writes below its right end. */
    title: string;
  };
  up: MapAxis<Up>;
  line?: MapLine<Across, Up>;
  spread?: MapSpreadText & { median: Up | undefined };
  coloredValues?: boolean;
  /** The label of the line at the return of the IHSG, such as IHSG 0.70%. */
  levelLabel?: string;
  /** The id of the heading that names the map, which also names its slider. */
  labelledBy: string;
  fill?: boolean;
  compact?: boolean;
}): ReactNode {
  const navigate = useNavigate();
  const isInBrowser = useIsInBrowser();
  const layout = useMemo(
    () =>
      layoutRiskMap({
        market,
        points,
        across,
        up,
        line,
        roomForCorners: spread !== undefined,
        ...(spread?.median === undefined ? {} : { median: spread.median }),
      }),
    [market, points, across, up, line, spread],
  );
  const drawn = useMemo(() => drawnPoints(market, layout), [market, layout]);
  const labels = useMemo(
    () => riskMapLabels(drawn, { line, levelLabel, layout, spread }),
    [drawn, line, levelLabel, layout, spread],
  );
  const marks = useMemo(
    () =>
      drawn.map(({ point, placed }) => ({
        key: point.key,
        position: placed.position,
        outerRadius: placed.outerRadius,
        selectionRadius: placed.outerRadius + markReach,
      })),
    [drawn],
  );
  const { placed, areaRef, drawingRef, measureRef, textSize } = useMapLabels(
    labels,
    marks,
    layout.upTextLength,
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
  const outsideRoom = spread === undefined ? sideRoom : spreadRoom;
  const plotClass =
    spread === undefined ? styles["plot"] : styles["spreadPlot"];
  const mapClass = riskMapClass(fill, compact);
  const style: CSSProperties = {
    paddingBlock: `${String(outsideRoom)}em ${String(bottomRoom)}em`,
    paddingInline: `calc(${String(layout.upTextLength)}ch + ${String(valueMarkGap)}em + ${String(keptNameRoom)} * var(--text-small)) ${String(outsideRoom)}em`,
  };
  const active = slider.marked === undefined ? undefined : stops[slider.marked];
  const drawing = (
    <MapDrawing
      layout={layout}
      drawn={drawn}
      placed={placed}
      texts={{ title: across.title, level: levelLabel, line: line?.name }}
      spread={spread}
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
      <div className={mapClass}>
        <div className={plotClass} style={style}>
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
      className={mapClass}
      onPointerDown={markPointer}
      onPointerMove={markPointer}
      onPointerLeave={sliderProps.onPointerLeave}
    >
      <div
        className={plotClass}
        style={style}
        {...sliderProps}
        role="slider"
        tabIndex={0}
        aria-valuenow={sliderProps["aria-valuenow"]}
        onKeyDown={(event) => {
          if (event.key === "Enter" && shown.point.href !== undefined) {
            event.preventDefault();
            void navigate(shown.point.href);
          } else {
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
          }
        }}
        onClick={(event) => {
          const area = areaRef.current;
          const size = textSize();
          if (area === null || size === undefined) return;
          const stop = nearestMapStop(stops, { event, area, textSize: size });
          const href = stop === undefined ? undefined : stops[stop]?.point.href;
          if (href !== undefined) void navigate(href);
        }}
        onPointerLeave={undefined}
      >
        <div ref={areaRef} className={styles["area"]}>
          {drawing}
          {active !== undefined && (
            <MapTip drawn={active} coloredValues={coloredValues} />
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}

/** The IHSG and every other point with the kind of its mark, in the order of the points after the IHSG. */
function riskMapClass(fill: boolean, compact: boolean): string {
  return [
    styles["riskMap"],
    fill ? styles["fill"] : "",
    compact ? styles["compact"] : "",
  ].join(" ");
}

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
