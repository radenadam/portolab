import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import type {
  DeepPartial,
  LineWidth,
  TickMarkType,
  Time,
  TimeChartOptions,
} from "lightweight-charts";
import type * as LightweightCharts from "lightweight-charts";
import { utcDateOf } from "~/calendar-dates";
import { secondMilliseconds } from "~/time-units";
import {
  formatCalendarDate,
  formatCalendarDatePart,
  formatSignedPercent,
} from "~/formatting";
import type { ReturnPoint } from "./portfolio-history";
import styles from "./trading.module.css";

type ChartLibrary = typeof LightweightCharts;

/** Draws the returns of a portfolio and of the IHSG at each close with Lightweight Charts, as decision 0008 sets: the portfolio in ink and the IHSG in muted gray with a dashed line, as decision 0012 sets. The table of returns beside the chart lists the same returns for screen readers and keyboards, as decision 0019 explains, so they skip the chart. */
export function ReturnChart({
  points,
}: {
  points: readonly ReturnPoint[];
}): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return undefined;
    }
    let isRemoved = false;
    let removeChart: (() => void) | undefined;
    // The library loads only on a page with a chart, so the other pages stay small on mobile data.
    import("lightweight-charts").then(
      (library) => {
        if (!isRemoved) {
          removeChart = drawReturns(library, container, points);
        }
      },
      () => {
        // A browser that cannot load the library, such as on a network that dropped, would show an empty frame, and the table of returns still lists every return.
        container.hidden = true;
      },
    );
    return () => {
      isRemoved = true;
      removeChart?.();
    };
  }, [points]);
  return <div ref={containerRef} className={styles["chart"]} aria-hidden />;
}

function drawReturns(
  library: ChartLibrary,
  container: HTMLElement,
  points: readonly ReturnPoint[],
): () => void {
  const chart = library.createChart(container, {
    autoSize: true,
    // A drag or a pinch on a phone scrolls the page instead of the chart, which shows every return at once.
    handleScroll: false,
    handleScale: false,
    timeScale: {
      fixLeftEdge: true,
      fixRightEdge: true,
      lockVisibleTimeRangeOnResize: true,
      tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) =>
        formatCalendarDatePart(
          calendarDateOf(time),
          tickMarkParts[tickMarkType],
        ),
    },
    localization: {
      priceFormatter: (fraction: number) => formatSignedPercent(fraction).text,
      timeFormatter: (time: Time) =>
        formatCalendarDate(calendarDateOf(time), "medium"),
    },
  });
  const priceFormat = {
    type: "custom" as const,
    formatter: (fraction: number) => formatSignedPercent(fraction).text,
    // A tick of the price scale is never finer than the hundredth of a percent that the returns show.
    minMove: 0.0001,
  };
  const portfolio = chart.addSeries(library.LineSeries, {
    lineStyle: library.LineStyle.Solid,
    priceFormat,
    priceLineVisible: false,
    lastValueVisible: false,
  });
  const market = chart.addSeries(library.LineSeries, {
    lineStyle: library.LineStyle.Dashed,
    priceFormat,
    priceLineVisible: false,
    lastValueVisible: false,
  });
  portfolio.setData(
    points.map((point) => ({ time: point.date, value: point.portfolio })),
  );
  market.setData(
    points.map((point) => ({ time: point.date, value: point.market })),
  );
  const zeroLine = portfolio.createPriceLine({
    price: 0,
    lineStyle: library.LineStyle.Solid,
    axisLabelVisible: false,
  });
  // The theme follows the setting of the device, as decision 0012 sets, so the chart takes the colors of the theme again when the setting changes.
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = (): void => {
    const theme = themeOf(library, container);
    chart.applyOptions(theme.chart);
    portfolio.applyOptions({ color: theme.ink, lineWidth: theme.markWidth });
    market.applyOptions({ color: theme.muted, lineWidth: theme.markWidth });
    zeroLine.applyOptions({ color: theme.line, lineWidth: theme.lineWidth });
  };
  applyTheme();
  colorScheme.addEventListener("change", applyTheme);
  chart.timeScale().fitContent();
  return () => {
    colorScheme.removeEventListener("change", applyTheme);
    chart.remove();
  };
}

// Lightweight Charts numbers the kinds of a mark on its time axis: the year, the month, the day, and two kinds with a time of day, which a chart of daily closes never shows, so they show the day.
const tickMarkParts: Record<TickMarkType, "year" | "month" | "day"> = {
  0: "year",
  1: "month",
  2: "day",
  3: "day",
  4: "day",
};

// The returns give each time as a calendar date, which Lightweight Charts hands back as a business day.
function calendarDateOf(time: Time): string {
  if (typeof time === "string") {
    return time;
  }
  return utcDateOf(
    typeof time === "number"
      ? new Date(time * secondMilliseconds)
      : new Date(Date.UTC(time.year, time.month - 1, time.day)),
  );
}

interface ChartTheme {
  chart: DeepPartial<TimeChartOptions>;
  ink: string;
  muted: string;
  line: string;
  /** The width of a series, which is a mark, and of a thin line, such as the line of zero. */
  markWidth: LineWidth;
  lineWidth: LineWidth;
}

// The colors, the font, and the widths of lines come from the tokens of app/theme.css, which the frame of the chart inherits, so the chart follows the theme without a copy of its values.
function themeOf(library: ChartLibrary, container: HTMLElement): ChartTheme {
  const style = getComputedStyle(container);
  const token = (name: string): string => style.getPropertyValue(name).trim();
  const ink = token("--color-ink");
  const muted = token("--color-muted");
  const line = token("--color-line");
  return {
    chart: {
      layout: {
        background: { type: library.ColorType.Solid, color: "transparent" },
        textColor: muted,
        fontFamily: token("--font-numbers"),
        fontSize: Number.parseFloat(style.fontSize),
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: line },
      },
      rightPriceScale: { borderColor: line },
      timeScale: { borderColor: line },
      crosshair: {
        vertLine: { color: muted, labelBackgroundColor: ink },
        horzLine: { color: muted, labelBackgroundColor: ink },
      },
    },
    ink,
    muted,
    line,
    markWidth: lineWidthOf(token("--size-mark")),
    lineWidth: lineWidthOf(token("--size-line")),
  };
}

// Lightweight Charts draws a line 1 to 4 pixels wide, so a size of the theme takes the first of them that is at least as wide, or the widest.
const lineWidths: readonly LineWidth[] = [1, 2, 3, 4];

function lineWidthOf(size: string): LineWidth {
  const pixels = Number.parseFloat(size);
  return lineWidths.find((width) => width >= pixels) ?? 4;
}
