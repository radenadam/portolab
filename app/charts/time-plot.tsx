import { useRef } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { formatCalendarDate, formatList } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { plotFraction } from "~/units/plot-fraction";
import { LineKey } from "./line-key";
import { percentOf, PlotLine } from "./plot";
import type { PlotPosition } from "./plot";
import { ValueMark, valueMarkGap } from "./value-mark";
import type { ValueAxisSide } from "./value-mark";
import { useChartSlider } from "./use-chart-slider";
import { tipAcross } from "./tip-placement";
import { acrossOf, indexAt } from "./time-chart-layout";
import type { LineKind, TimeChartLayout, TimeLine } from "./time-chart-layout";
import styles from "./time-chart.module.css";
import { useIsInBrowser } from "./use-is-in-browser";
import { placeTimeEvents } from "./place-time-events";
import type { TimeEvent } from "./place-time-events";
import { timeEndLabels } from "./time-end-labels";

const lineClasses: Record<LineKind, string | undefined> = {
  own: styles["own"],
  reference: styles["reference"],
};

// The line that the chart is about comes last, so the line that it is compared with never hides it.
const drawOrder: Record<LineKind, number> = { reference: 0, own: 1 };

// Every length around the plot is a multiple of the size of the text of the chart, so the chart keeps its proportions when a reader enlarges the text.
const dateBaseline = 1.5;
const headroom = 0.5;
const dotRadius = 0.4;
const noEvents: readonly TimeEvent[] = [];

/** The plot with its axes, its lines, and a dot on each line at the marked date, which is the latest date until a reader marks another. In the browser it is a slider that marks a date with a crosshair and shows a tooltip of its values. */
export function TimePlot<Point extends { date: string }, Value extends number>({
  points,
  lines,
  layout,
  labelledBy,
  valueText,
  valueNode,
  area = false,
  axisSide = "left",
  annotations = noEvents,
}: {
  points: readonly Point[];
  lines: readonly TimeLine<Point, Value>[];
  valueText: (value: Value) => string;
  valueNode: (value: Value) => ReactNode;
  area?: boolean;
  axisSide?: ValueAxisSide;
  layout: TimeChartLayout;
  labelledBy: string;
  annotations?: readonly TimeEvent[] | undefined;
}): ReactNode {
  const isInBrowser = useIsInBrowser();
  const {
    marked: active,
    shown: marked,
    setMarked: setActive,
    sliderProps,
  } = useChartSlider({
    count: points.length,
    resting: points.length - 1,
    labelledBy,
  });
  const drawingRef = useRef<SVGSVGElement>(null);
  const labelRoom = `calc(${String(layout.valueTextLength)}ch + ${String(valueMarkGap)}em)`;
  const edgeRoom = `${String(dotRadius)}em`;
  const latest = points.at(-1);
  const endLabels = timeEndLabels(lines, { latest, layout, valueText });
  const endRoom = `${String(Math.max(0, ...endLabels.map((label) => label.text.length)) * 0.6 + 1)}em`;
  const rightRoom =
    endLabels.length === 0 ? edgeRoom : "var(--time-chart-end-room)";
  const plotClass = [
    styles["plot"],
    endLabels.length === 0 ? "" : styles["endLabelPlot"],
  ].join(" ");
  const inlinePadding: Record<ValueAxisSide, string> = {
    left: `${labelRoom} ${rightRoom}`,
    right: `${edgeRoom} ${labelRoom}`,
  };
  const style: CSSProperties = {
    ...(endLabels.length === 0 ? {} : { "--time-chart-end-width": endRoom }),
    paddingBlock: `${String(annotations.length === 0 ? headroom : dateBaseline)}em ${String(dateBaseline + headroom)}em`,
    paddingInline: inlinePadding[axisSide],
  };
  const drawnLines = layout.lines.toSorted(
    (first, second) => drawOrder[first.kind] - drawOrder[second.kind],
  );
  const drawing = (
    <svg ref={drawingRef} className={styles["drawing"]} aria-hidden>
      {placeTimeEvents(
        points.map((point) => point.date),
        annotations,
      ).map((event) => (
        <g key={event.label}>
          <line
            x1={percentOf(event.at)}
            x2={percentOf(event.at)}
            y1="0"
            y2="100%"
            className={styles["sessionLine"]}
          />
          <text
            x={percentOf(event.at)}
            y="0"
            dy="-0.5em"
            textAnchor={
              event.at === 0 ? "start" : event.at === 1 ? "end" : "middle"
            }
            className={event.minor ? styles["minorEvent"] : styles["event"]}
          >
            {event.label}
          </text>
        </g>
      ))}
      {layout.valueTicks.map((tick) => (
        <ValueMark
          key={tick.at}
          at={tick.at}
          text={tick.text}
          side={axisSide}
          lineClassName={tick.isZero ? styles["zeroLine"] : styles["gridLine"]}
          textClassName={styles["tick"]}
        />
      ))}
      {layout.dateTicks.map((tick) => (
        <text
          key={tick.at}
          x={percentOf(tick.at)}
          y="100%"
          dy={`${String(dateBaseline)}em`}
          textAnchor={tick.anchor}
          className={tick.isMinor ? styles["minorTick"] : styles["tick"]}
        >
          {tick.text}
        </text>
      ))}
      {active !== undefined && (
        <line
          x1={percentOf(acrossOf(active, points.length))}
          x2={percentOf(acrossOf(active, points.length))}
          y1="0"
          y2="100%"
          className={styles["crosshair"]}
        />
      )}
      {drawnLines.map(({ kind, positions }) => (
        <g key={kind} className={lineClasses[kind]}>
          <PlotLine
            positions={positions}
            className={styles["line"]}
            area={area}
          />
          <Dot position={positions[marked]} />
        </g>
      ))}
      {endLabels.map((label) => (
        <text
          key={label.text}
          x={percentOf(label.position.x)}
          y={percentOf(label.position.y)}
          dx="0.75em"
          dy={label.dy}
          className={styles["endLabel"]}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
  const point = points[marked];
  if (!isInBrowser || point === undefined) {
    return (
      <div className={plotClass} style={style}>
        <div className={styles["area"]}>{drawing}</div>
      </div>
    );
  }
  const markPointer = (event: PointerEvent<HTMLDivElement>): void => {
    const box = drawingRef.current?.getBoundingClientRect();
    if (box !== undefined) {
      setActive(
        indexAt(
          plotFraction((event.clientX - box.left) / box.width),
          points.length,
        ),
      );
    }
  };
  return (
    <div
      className={plotClass}
      style={style}
      {...sliderProps(pointText(point, lines, valueText))}
      onPointerDown={markPointer}
      onPointerMove={markPointer}
    >
      <div className={styles["area"]}>
        {drawing}
        {active !== undefined && (
          <div
            className={styles["tip"]}
            style={tipAcross(acrossOf(active, points.length))}
          >
            <p className={styles["tipDate"]}>
              {formatCalendarDate(point.date, "medium")}
            </p>
            {lines.map((line) => (
              <p key={line.name} className={styles["tipLine"]}>
                <LineKey kind={line.kind} />
                <span>{line.name}</span>
                <span className={styles["tipValue"]}>
                  {valueNode(line.valueOf(point))}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** The text of a point that a screen reader reads as the value of the slider, such as 3 Nov 2026: Portofolio Anda -3,07% dan IHSG -3,02%. */
function pointText<Point extends { date: string }, Value extends number>(
  point: Point,
  lines: readonly TimeLine<Point, Value>[],
  valueText: (value: Value) => string,
): string {
  return m.app_chart_point_label({
    date: formatCalendarDate(point.date, "medium"),
    values: formatList(
      lines.map((line) =>
        m.app_chart_line_value_part({
          line: line.name,
          value: valueText(line.valueOf(point)),
        }),
      ),
      "conjunction",
    ),
  });
}

function Dot({ position }: { position: PlotPosition | undefined }): ReactNode {
  if (position === undefined) {
    return null;
  }
  return (
    <circle
      cx={percentOf(position.x)}
      cy={percentOf(position.y)}
      r={`${String(dotRadius)}em`}
      className={styles["dot"]}
    />
  );
}
