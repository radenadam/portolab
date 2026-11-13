import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import legendStyles from "~/chart-legend.module.css";
import { pixels } from "~/units/pixels";
import type { MarketLine } from "./capm";
import { layoutMarketLineChart, markRadii } from "./market-line-layout";
import type { ChartFrame, ChartPoint, PointKind } from "./market-line-layout";
import styles from "./measures.module.css";
import { subscriptStyle } from "./point-labels";
import type { PointLabel } from "./point-labels";

// The server cannot measure the frame, so it lays out the chart for a frame of the size of a phone. Any size serves until the browser measures the frame, because the browser scales the drawing into the frame.
const unmeasuredFrame: ChartFrame = {
  width: pixels(328),
  height: pixels(256),
  fontSize: pixels(14),
};

// The many marks of the stocks that the portfolio does not hold come first, so they never hide the marks of the portfolio, of its stocks, or of the line.
const drawOrder: Record<PointKind, number> = {
  otherStock: 0,
  holding: 1,
  riskFree: 2,
  market: 2,
  portfolio: 3,
};

/** Draws a security market line and its points in SVG, as decision 0008 sets, in the colors and the font of decision 0028, at the size of its frame. It is hidden from assistive technology, because the table of its points below it lists every point, as decision 0023 explains. */
export function MarketLineChart({
  line,
  points,
}: {
  line: MarketLine;
  points: readonly ChartPoint[];
}): ReactNode {
  const frameRef = useRef<HTMLDivElement>(null);
  const frame = useFrame(frameRef);
  const layout = layoutMarketLineChart(line, points, frame);
  const { plot, titles } = layout;
  return (
    <div ref={frameRef} className={styles["marketLineChart"]} aria-hidden>
      <svg
        viewBox={`0 0 ${String(frame.width)} ${String(frame.height)}`}
        fontSize={frame.fontSize}
      >
        {layout.returnTicks.map((tick) => (
          <g key={tick.position}>
            <line
              x1={plot.left}
              x2={plot.right}
              y1={tick.position}
              y2={tick.position}
              className={styles["gridLine"]}
            />
            <text
              x={tick.textAt.x}
              y={tick.textAt.y}
              textAnchor="end"
              className={styles["tick"]}
            >
              {tick.text}
            </text>
          </g>
        ))}
        <line
          x1={plot.left}
          x2={plot.right}
          y1={plot.bottom}
          y2={plot.bottom}
          className={styles["axis"]}
        />
        {layout.betaTicks.map((tick) => (
          <text
            key={tick.position}
            x={tick.textAt.x}
            y={tick.textAt.y}
            textAnchor="middle"
            className={styles["tick"]}
          >
            {tick.text}
          </text>
        ))}
        <text
          x={titles.expectedReturn.x}
          y={titles.expectedReturn.y}
          className={styles["axisTitle"]}
        >
          E(R)
        </text>
        <text
          x={titles.beta.x}
          y={titles.beta.y}
          textAnchor="middle"
          className={styles["axisTitle"]}
        >
          β
        </text>
        <line
          x1={layout.line.start.x}
          y1={layout.line.start.y}
          x2={layout.line.end.x}
          y2={layout.line.end.y}
          className={styles["marketLine"]}
        />
        {layout.points
          .toSorted(
            (first, second) => drawOrder[first.kind] - drawOrder[second.kind],
          )
          .map(({ name, kind, x, y, radius }) => (
            <PointMark key={name} kind={kind} x={x} y={y} radius={radius} />
          ))}
        {layout.labels.map((placed) => (
          <text
            key={placed.name}
            x={placed.x}
            y={placed.y}
            className={styles["pointLabel"]}
          >
            <LabelText label={placed.label} />
          </text>
        ))}
      </svg>
    </div>
  );
}

/** The marks of kinds of point beside their names, which screen readers skip, as they skip the chart. */
export function MarketLineLegend({
  items,
}: {
  items: readonly { kind: PointKind; name: ReactNode }[];
}): ReactNode {
  return (
    <ul className={legendStyles["legend"]} aria-hidden>
      {items.map(({ kind, name }) => (
        <li key={kind} className={styles["legendItem"]}>
          {/* The mark has the size of the text, so its viewBox counts in sizes of the text, as the radii of the marks do. */}
          <svg viewBox="-0.5 -0.5 1 1" className={styles["legendMark"]}>
            <PointMark kind={kind} x={0} y={0} radius={markRadii[kind]} />
          </svg>
          {name}
        </li>
      ))}
    </ul>
  );
}

function PointMark({
  kind,
  x,
  y,
  radius,
}: {
  kind: PointKind;
  x: number;
  y: number;
  radius: number;
}): ReactNode {
  switch (kind) {
    case "riskFree":
    case "market":
      return (
        <rect
          x={x - radius}
          y={y - radius}
          width={2 * radius}
          height={2 * radius}
          className={styles["anchorMark"]}
        />
      );
    case "portfolio":
      return (
        <polygon
          points={[
            [x, y - radius],
            [x + radius, y],
            [x, y + radius],
            [x - radius, y],
          ]
            .map((corner) => corner.join(","))
            .join(" ")}
          className={styles["portfolioMark"]}
        />
      );
    case "holding":
      return (
        <circle cx={x} cy={y} r={radius} className={styles["holdingMark"]} />
      );
    case "otherStock":
      return (
        <circle cx={x} cy={y} r={radius} className={styles["otherStockMark"]} />
      );
  }
}

function LabelText({ label }: { label: PointLabel }): ReactNode {
  return (
    <>
      {label.text}
      {label.subscript !== "" && (
        <tspan
          dy={`${String(subscriptStyle.shift)}em`}
          fontSize={`${String(subscriptStyle.size * 100)}%`}
        >
          {label.subscript}
        </tspan>
      )}
    </>
  );
}

/** The size of a frame and of its text, which the browser measures again whenever the frame changes its size. */
function useFrame(frameRef: RefObject<HTMLDivElement | null>): ChartFrame {
  const [frame, setFrame] = useState(unmeasuredFrame);
  useEffect(() => {
    const element = frameRef.current;
    if (element === null) {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      setFrame({
        width: pixels(element.clientWidth),
        height: pixels(element.clientHeight),
        fontSize: pixels(Number.parseFloat(getComputedStyle(element).fontSize)),
      });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [frameRef]);
  return frame;
}
