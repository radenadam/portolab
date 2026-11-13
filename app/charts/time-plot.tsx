import { useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { ChangeText } from "~/change-text";
import {
  formatCalendarDate,
  formatList,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { plotFraction } from "~/units/plot-fraction";
import { LineKey } from "./line-key";
import { percentOf, PlotLine } from "./plot";
import type { PlotPosition } from "./plot";
import {
  acrossOf,
  crosshairMoveOf,
  indexAt,
  tipPlacement,
} from "./time-chart-layout";
import type { LineKind, TimeChartLayout, TimeLine } from "./time-chart-layout";
import styles from "./time-chart.module.css";

const lineClasses: Record<LineKind, string | undefined> = {
  own: styles["own"],
  reference: styles["reference"],
};

// The line that the chart is about comes last, so the line that it is compared with never hides it.
const drawOrder: Record<LineKind, number> = { reference: 0, own: 1 };

// Every length around the plot is a multiple of the size of the text of the chart, so the chart keeps its proportions when a reader enlarges the text.
const textGap = 0.75;
const dateBaseline = 1.5;
const headroom = 0.5;
const dotRadius = 0.4;

// Whether the page runs in a browser never changes, so the store never calls back.
function subscribeToNothing(): () => void {
  return () => undefined;
}

/** The plot with its axes, its lines, and a dot on each line at the marked date, which is the latest date until a reader marks another. In the browser it is a slider that marks a date with a crosshair and shows a tooltip of its returns. */
export function TimePlot<Point extends { date: string }>({
  points,
  lines,
  layout,
  labelledBy,
}: {
  points: readonly Point[];
  lines: readonly TimeLine<Point>[];
  layout: TimeChartLayout;
  labelledBy: string;
}): ReactNode {
  // The server and the first render in the browser draw the plot alone, so a reader before JavaScript loads meets no slider that does nothing.
  const isInBrowser = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [active, setActive] = useState<number | undefined>(undefined);
  const drawingRef = useRef<SVGSVGElement>(null);
  const last = points.length - 1;
  const marked = active ?? last;
  const style: CSSProperties = {
    paddingBlock: `${String(headroom)}em ${String(dateBaseline + headroom)}em`,
    paddingInline: `calc(${String(layout.returnTextLength)}ch + ${String(textGap)}em) ${String(dotRadius)}em`,
  };
  const drawnLines = layout.lines.toSorted(
    (first, second) => drawOrder[first.kind] - drawOrder[second.kind],
  );
  const drawing = (
    <svg ref={drawingRef} className={styles["drawing"]} aria-hidden>
      {layout.returnTicks.map((tick) => (
        <g key={tick.text}>
          <line
            x1="0"
            x2="100%"
            y1={percentOf(tick.at)}
            y2={percentOf(tick.at)}
            className={tick.isZero ? styles["zeroLine"] : styles["gridLine"]}
          />
          <text
            x="0"
            y={percentOf(tick.at)}
            dx={`${String(-textGap)}em`}
            dy="0.35em"
            textAnchor="end"
            className={styles["tick"]}
          >
            {tick.text}
          </text>
        </g>
      ))}
      {layout.dateTicks.map((tick) => (
        <text
          key={tick.text}
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
          <PlotLine positions={positions} className={styles["line"]} />
          <Dot position={positions[marked]} />
        </g>
      ))}
    </svg>
  );
  const point = points[marked];
  if (!isInBrowser || point === undefined) {
    return (
      <div className={styles["plot"]} style={style}>
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
      className={styles["plot"]}
      style={style}
      role="slider"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={marked}
      aria-valuetext={pointText(point, lines)}
      onFocus={() => {
        setActive((current) => current ?? last);
      }}
      onBlur={() => {
        setActive(undefined);
      }}
      onKeyDown={(event) => {
        const move = crosshairMoveOf(event.key, active, points.length);
        switch (move.kind) {
          case "mark":
            event.preventDefault();
            setActive(move.index);
            return;
          case "hide":
            event.preventDefault();
            setActive(undefined);
            return;
          case "ignore":
            return;
        }
      }}
      onPointerDown={markPointer}
      onPointerMove={markPointer}
      onPointerLeave={(event) => {
        // A finger that lifts leaves the crosshair where it was, so the reader can read the tooltip.
        if (event.pointerType === "mouse") {
          setActive(undefined);
        }
      }}
    >
      <div className={styles["area"]}>
        {drawing}
        {active !== undefined && (
          <div
            className={styles["tip"]}
            style={tipPlacement(acrossOf(active, points.length))}
          >
            <p className={styles["tipDate"]}>
              {formatCalendarDate(point.date, "medium")}
            </p>
            {lines.map((line) => (
              <p key={line.name} className={styles["tipLine"]}>
                <LineKey kind={line.kind} />
                <span>{line.name}</span>
                <span className={styles["tipReturn"]}>
                  <ChangeText
                    change={formatSignedPercent(line.returnOf(point))}
                  />
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
function pointText<Point extends { date: string }>(
  point: Point,
  lines: readonly TimeLine<Point>[],
): string {
  return m.app_chart_point_label({
    date: formatCalendarDate(point.date, "medium"),
    returns: formatList(
      lines.map((line) =>
        m.app_chart_line_return_part({
          line: line.name,
          value: formatSignedPercent(line.returnOf(point)).text,
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
