import type { ReactNode, Ref } from "react";
import type { LabelPlace, PlacedLabels } from "./map-labels";
import { keptNameRoom } from "./map-labels";
import { percentOf } from "./plot";
import { ReturnMark } from "./return-mark";
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

/** The keys by which the map finds the place of the label of each of its lines. */
export const lineLabelKeys = { level: "level", line: "line" } as const;

/** How far the ring of a marked point stands outside its mark, in sizes of the text of the labels, which is also how far beyond its mark a point answers a pointer. */
export const markReach = 0.33;

// The marks of the stocks that the portfolio does not hold come first, so they never hide the marks of the portfolio, of its stocks, or of the IHSG, and the mark of the reader comes last.
const drawOrder: Record<MarkKind, number> = {
  other: 0,
  held: 1,
  market: 2,
  own: 3,
};

// Every length around the plot is a multiple of the size of the text of its marks, so the map keeps its proportions when a reader enlarges the text.
const tickBaseline = 1.5;
const titleBaseline = 3;

/** The drawing of the map in its plot: the marks of both axes with their lines, the strong line through the risk of the IHSG, the name of the axis of risk, the dashed line at the return of the IHSG, the line through the IHSG, the mark of each point, a ring around the marked point, and the labels where they have a place. It also holds a hidden text in the font of the labels, which the browser measures each label with. Screen readers skip it. */
export function MapDrawing({
  layout,
  drawn,
  placed,
  texts,
  active,
  drawingRef,
  measureRef,
}: {
  layout: RiskMapLayout<unknown>;
  drawn: readonly DrawnPoint[];
  placed: PlacedLabels;
  texts: { title: string; level: string; line: string };
  active: DrawnPoint | undefined;
  drawingRef: Ref<SVGSVGElement>;
  measureRef: Ref<SVGTextElement>;
}): ReactNode {
  return (
    <svg ref={drawingRef} className={styles["drawing"]} aria-hidden>
      <Axes layout={layout} title={texts.title} />
      <line
        x1="0"
        x2="100%"
        y1={percentOf(layout.market.position.y)}
        y2={percentOf(layout.market.position.y)}
        className={styles["level"]}
      />
      <line
        x1={percentOf(layout.line.start.x)}
        y1={percentOf(layout.line.start.y)}
        x2={percentOf(layout.line.end.x)}
        y2={percentOf(layout.line.end.y)}
        className={styles["line"]}
      />
      {drawn
        .toSorted(
          (first, second) => drawOrder[first.kind] - drawOrder[second.kind],
        )
        .map(({ point, kind, placed: mark }) => (
          <Mark key={point.key} kind={kind} placed={mark} />
        ))}
      {active !== undefined && (
        <circle
          cx={percentOf(active.placed.position.x)}
          cy={percentOf(active.placed.position.y)}
          r={em(active.placed.outerRadius + markReach)}
          className={styles["active"]}
        />
      )}
      <Label
        text={texts.level}
        place={placed.lines.get(lineLabelKeys.level)}
        className={styles["lineLabel"]}
      />
      <Label
        text={texts.line}
        place={placed.lines.get(lineLabelKeys.line)}
        className={styles["lineLabel"]}
      />
      {drawn.map(({ point }) => (
        <Label
          key={point.key}
          text={point.name}
          place={placed.points.get(point.key)}
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
        <ReturnMark
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
            dy={em(tickBaseline)}
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
        dy={em(titleBaseline)}
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

// Two decimals of a size of the text place a mark within a tenth of a pixel, and they keep the page small.
function em(length: number): string {
  return `${String(Math.round(length * 100) / 100)}em`;
}

function Mark({
  kind,
  placed,
}: {
  kind: MarkKind;
  placed: PlacedMark;
}): ReactNode {
  const cx = percentOf(placed.position.x);
  const cy = percentOf(placed.position.y);
  const dot = (className: string | undefined): ReactNode => (
    <circle cx={cx} cy={cy} r={em(placed.radius)} className={className} />
  );
  switch (kind) {
    case "own":
      return (
        <g>
          <circle
            cx={cx}
            cy={cy}
            r={em(placed.outerRadius)}
            className={styles["ring"]}
          />
          {dot(styles["own"])}
        </g>
      );
    case "held":
      return dot(styles["held"]);
    case "other":
      return dot(styles["other"]);
    case "market":
      return <Diamond placed={placed} />;
  }
}

/** The diamond of the IHSG. A path cannot place a corner at a position of the plot plus a length in sizes of the text, so an inner drawing stands at the position of the IHSG, and the diamond fills a drawing of its own size around that position. */
function Diamond({ placed }: { placed: PlacedMark }): ReactNode {
  const size = em(2 * placed.radius);
  return (
    <svg
      x={percentOf(placed.position.x)}
      y={percentOf(placed.position.y)}
      overflow="visible"
    >
      <svg
        x={em(-placed.radius)}
        y={em(-placed.radius)}
        width={size}
        height={size}
        viewBox="-1 -1 2 2"
        overflow="visible"
      >
        <path
          d="M0 -1L1 0L0 1L-1 0Z"
          vectorEffect="non-scaling-stroke"
          className={styles["market"]}
        />
      </svg>
    </svg>
  );
}

function Label({
  text,
  place,
  className,
}: {
  text: string;
  place: LabelPlace | undefined;
  className: string | undefined;
}): ReactNode {
  if (place === undefined) {
    return null;
  }
  return (
    <text
      x={percentOf(place.at.x)}
      y={percentOf(place.at.y)}
      dx={em(place.dx)}
      dy={em(place.dy)}
      textAnchor={place.anchor}
      className={className}
    >
      {text}
    </text>
  );
}
