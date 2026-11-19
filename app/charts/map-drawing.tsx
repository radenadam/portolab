import { MapLabel } from "./map-label";
import { mapLineLabelKeys, mapPointName } from "./map-label-text";
import { MapDiamond } from "./map-diamond";
import { MapArrow } from "./map-arrow";
import type { ReactNode, Ref } from "react";
import type { PlacedLabels } from "./map-labels";
import { keptNameRoom } from "./map-labels";
import { emOf, percentOf } from "./plot";
import { ValueMark } from "./value-mark";
import type {
  MapMark,
  MapPoint,
  PlacedMark,
  RiskMapLayout,
} from "./layout-risk-map";
import styles from "./risk-map.module.css";

/** How the map draws a mark: the mark of a kind of point, or the diamond of the IHSG. */
export type MarkKind = MapMark["kind"] | "market";

/** A point of the map as the map draws it, with the kind of its mark. */
export interface DrawnPoint {
  point: MapPoint<number, number>;
  kind: MarkKind;
  placed: PlacedMark;
}

/** How far the ring of a marked point stands outside its mark, in sizes of the text of the labels, which is also how far beyond its mark a point answers a pointer. */
export const markReach = 0.33;

// Background context must not hide the subjects of the map or the reader's own mark.
const drawOrder: Record<MarkKind, number> = {
  other: 0,
  average: 0,
  classmate: -1,
  active: 1,
  held: 1,
  market: 2,
  own: 3,
  before: 2,
};

// Every length around the plot is a multiple of the size of the text of its marks, so the map keeps its proportions when a reader enlarges the text.
const tickBaseline = 1.5;
const titleBaseline = 3;

/** Maps with different subjects share axes and label placement. A hidden text lets the browser measure labels in the font that draws them. */
export function MapDrawing({
  layout,
  drawn,
  placed,
  texts,
  active,
  spread,
  drawingRef,
  measureRef,
}: {
  layout: RiskMapLayout<unknown>;
  drawn: readonly DrawnPoint[];
  placed: PlacedLabels;
  texts: { title: string; level: string | undefined; line: string | undefined };
  active: DrawnPoint | undefined;
  spread: ReactNode;
  drawingRef: Ref<SVGSVGElement>;
  measureRef: Ref<SVGTextElement>;
}): ReactNode {
  return (
    <svg ref={drawingRef} className={styles["drawing"]} aria-hidden>
      <Axes layout={layout} title={texts.title} />
      {texts.level !== undefined && (
        <line
          x1="0"
          x2="100%"
          y1={percentOf(layout.market.position.y)}
          y2={percentOf(layout.market.position.y)}
          className={styles["level"]}
        />
      )}
      {layout.line !== undefined && (
        <line
          x1={percentOf(layout.line.start.x)}
          y1={percentOf(layout.line.start.y)}
          x2={percentOf(layout.line.end.x)}
          y2={percentOf(layout.line.end.y)}
          className={styles["line"]}
        />
      )}
      {spread}
      {drawn.map(({ point, placed: mark }) => (
        <g key={`stem-${point.key}`}>
          {mark.stem !== undefined && (
            <line
              x1={percentOf(mark.position.x)}
              x2={percentOf(mark.position.x)}
              y1={percentOf(mark.stem)}
              y2={percentOf(mark.position.y)}
              className={
                mark.position.y < mark.stem
                  ? styles["gainStem"]
                  : styles["lossStem"]
              }
            />
          )}
          {point.arrowTo !== undefined && (
            <MapArrow
              from={mark}
              to={
                drawn.find((candidate) => candidate.point.key === point.arrowTo)
                  ?.placed
              }
            />
          )}
        </g>
      ))}
      {drawn
        .toSorted(
          (first, second) => drawOrder[first.kind] - drawOrder[second.kind],
        )
        .map(({ point, kind, placed: mark }) => (
          <Mark
            key={point.key}
            kind={kind}
            placed={mark}
            isActive={point.key === active?.point.key}
          />
        ))}
      {/* The mark of the reader draws a ring already, so that ring marks it when it is active, and the point shows one ring. */}
      {active !== undefined && active.kind !== "own" && (
        <circle
          cx={percentOf(active.placed.position.x)}
          cy={percentOf(active.placed.position.y)}
          r={emOf(active.placed.outerRadius + markReach)}
          className={styles["active"]}
        />
      )}
      <MapLabel
        text={texts.level}
        place={placed.lines.get(mapLineLabelKeys.level)}
        className={styles["lineLabel"]}
      />
      <MapLabel
        text={texts.line}
        place={placed.lines.get(mapLineLabelKeys.line)}
        className={styles["lineLabel"]}
      />
      {drawn.map(({ point, kind }) => (
        <MapLabel
          key={point.key}
          text={mapPointName({ point, kind })}
          value={placed.values.has(point.key) ? point.labelValue : undefined}
          place={placed.points.get(point.key)}
          kind="point"
          className={styles["label"]}
        />
      ))}
      <text ref={measureRef} className={styles["label"]} visibility="hidden" />
    </svg>
  );
}

function Axes({
  layout,
  title,
}: {
  layout: RiskMapLayout<unknown>;
  title: string;
}): ReactNode {
  return (
    <>
      {layout.upTicks.map((tick) => (
        <ValueMark
          key={tick.at}
          at={tick.at}
          text={tick.text}
          textShift={`calc(-${String(keptNameRoom)} * var(--text-small))`}
          lineClassName={
            tick.isZero ? styles["strongLine"] : styles["gridLine"]
          }
          textClassName={styles["tick"]}
        />
      ))}
      {layout.acrossTicks.map((tick) => (
        <g key={tick.at}>
          <line
            x1={percentOf(tick.at)}
            x2={percentOf(tick.at)}
            y1="0"
            y2="100%"
            className={styles["gridLine"]}
          />
          <text
            x={percentOf(tick.at)}
            y="100%"
            dy={emOf(tickBaseline)}
            textAnchor="middle"
            className={acrossTickClass(tick)}
          >
            {tick.text}
          </text>
        </g>
      ))}
      <line
        x1={percentOf(layout.market.position.x)}
        x2={percentOf(layout.market.position.x)}
        y1="0"
        y2="100%"
        className={styles["strongLine"]}
      />
      <text
        x="100%"
        y="100%"
        dy={emOf(titleBaseline)}
        textAnchor="end"
        className={styles["axisTitle"]}
      >
        {title}
      </text>
    </>
  );
}

function acrossTickClass(tick: {
  isMarket: boolean;
  isMinor: boolean;
}): string | undefined {
  if (tick.isMarket) {
    return styles["marketTick"];
  }
  return tick.isMinor ? styles["minorTick"] : styles["tick"];
}

function Mark({
  kind,
  placed,
  isActive,
}: {
  kind: MarkKind;
  placed: PlacedMark;
  isActive: boolean;
}): ReactNode {
  const cx = percentOf(placed.position.x);
  const cy = percentOf(placed.position.y);
  const dot = (className: string | undefined): ReactNode => (
    <circle cx={cx} cy={cy} r={emOf(placed.radius)} className={className} />
  );
  switch (kind) {
    case "own":
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={emOf(placed.outerRadius)}
            className={isActive ? styles["active"] : styles["ring"]}
          />
          {dot(styles["own"])}
        </g>
      );
    case "active":
    case "held":
      return dot(styles["held"]);
    case "average":
      return dot(styles["average"]);
    case "before":
      return dot(styles["before"]);
    case "classmate":
      return dot(styles["classmate"]);
    case "other":
      return dot(styles["other"]);
    case "market":
      return <MapDiamond placed={placed} />;
  }
}
