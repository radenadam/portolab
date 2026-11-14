import {
  formatCalendarDatePart,
  formatSignedPercent,
  smallestPercentStep,
} from "~/formatting";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { plotFraction } from "~/units/plot-fraction";
import type { PlotFraction } from "~/units/plot-fraction";
import type { PlotPosition } from "./plot";
import { fractionOf, niceTicks, paddedRange } from "./scale";
import type { Range } from "./scale";

/** How a line of a chart over time is drawn: the portfolio that the chart is about, which is the reader's own or the one that the reader opened, in the color of the reader's own point, and a line that it is compared with, such as the IHSG, in the muted ink, as decision 0028 sets. */
export type LineKind = "own" | "reference" | "rise" | "fall" | "flat";

/** A line of a chart over time: the name that its legend, its tooltip, and its table show, how it is drawn, and its value at each point of the chart. */
export interface TimeLine<Point, Value extends number = CumulativeReturn> {
  name: string;
  kind: LineKind;
  valueOf: (point: Point) => Value;
}

/** Where a text starts, has its middle, or ends, at its position. */
type TextAnchor = "start" | "middle" | "end";

/** The zero mark is distinguished so a return chart can show its starting level. */
interface ValueTick {
  at: PlotFraction;
  text: string;
  isZero: boolean;
}

/** A mark of the axis of time: where it stands across the plot, its date, and where its text sits against it. A minor mark stands between two others, so a narrow chart can leave it out. */
interface DateTick {
  at: PlotFraction;
  text: string;
  anchor: TextAnchor;
  isMinor: boolean;
}

/** Where a chart over time draws each of its parts in its plot. */
export interface TimeChartLayout {
  /** The marks of the value axis at round values, from the lowest. */
  valueTicks: ValueTick[];
  /** The characters of the longest text of a value mark. DM Mono, the font of codes that decision 0028 sets for the labels of charts, draws each character equally wide, so the plot leaves this many widths of a character for the texts. */
  valueTextLength: number;
  /** The marks of the axis of time, from the oldest date. */
  dateTicks: DateTick[];
  /** Each line with the position of its value at each date, in the order of the lines and of the dates. */
  lines: { kind: LineKind; positions: PlotPosition[] }[];
}

// Four steps of the value axis keep their texts apart at the height of a chart on a phone.
const valueTickCount = 4;
// Five dates evenly apart fit the axis of time of a wide chart, and a narrow chart keeps the three that are not minor, as the references of decision 0028 draw them.
const dateTickCount = 5;

/** Lays out a chart of the returns of lines over the dates of at least one trading day: the returns of every line on one axis that marks round values and zero, the dates evenly across, and the position of each return. */
export function layoutTimeChart(
  dates: readonly string[],
  lines: readonly { kind: LineKind; values: readonly CumulativeReturn[] }[],
): TimeChartLayout {
  return layoutTimeSeries(dates, lines, {
    unit: cumulativeReturn,
    smallestStep: smallestPercentStep,
    tickText: (value) => formatSignedPercent(value, "upToTwo").text,
  });
}

/** Uses the unit and format of its caller so prices and returns share the same geometry without mixing their units. */
export function layoutTimeSeries<Value extends number>(
  dates: readonly string[],
  lines: readonly { kind: LineKind; values: readonly Value[] }[],
  format: {
    unit: (value: number) => Value;
    smallestStep: number;
    tickText: (value: Value) => string;
    minimum?: Value;
    dateText?: (date: string) => string;
  },
): TimeChartLayout {
  const range = paddedRange(
    lines.flatMap((line) => line.values),
    format.unit,
    format.minimum,
  );
  const valueTicks = niceTicks(
    range,
    { count: valueTickCount, smallestStep: format.smallestStep },
    format.unit,
  ).map((value) => ({
    at: heightOf(range, value),
    text: format.tickText(value),
    isZero: value === 0,
  }));
  let valueTextLength = 0;
  for (const tick of valueTicks) {
    valueTextLength = Math.max(valueTextLength, tick.text.length);
  }
  return {
    valueTicks,
    valueTextLength,
    dateTicks: dateTicksOf(dates, format.dateText),
    lines: lines.map(({ kind, values }) => ({
      kind,
      positions: values.map((value, index) => ({
        x: acrossOf(index, dates.length),
        y: heightOf(range, value),
      })),
    })),
  };
}

function heightOf<Value extends number>(
  range: Range<Value>,
  value: Value,
): PlotFraction {
  return plotFraction(1 - fractionOf(range, value));
}

/** Where the date of an index stands across the plot among a number of dates. A chart of one date shows its one value at the right edge, where every other chart shows its latest value. */
export function acrossOf(index: number, count: number): PlotFraction {
  return plotFraction(count <= 1 ? 1 : index / (count - 1));
}

function dateTicksOf(
  dates: readonly string[],
  dateText = (date: string) => formatCalendarDatePart(date, "dayAndMonth"),
): DateTick[] {
  // Two marks can fall on one date of a short chart, and the date stays a major mark when either of them is major.
  const isMinorOf = new Map<number, boolean>();
  for (let mark = 0; mark < dateTickCount; mark += 1) {
    const index = Math.round((mark / (dateTickCount - 1)) * (dates.length - 1));
    const isMinor = mark % 2 === 1;
    isMinorOf.set(index, (isMinorOf.get(index) ?? true) && isMinor);
  }
  return dates.flatMap((date, index) => {
    const isMinor = isMinorOf.get(index);
    if (isMinor === undefined) {
      return [];
    }
    const at = acrossOf(index, dates.length);
    return [
      {
        at,
        text: dateText(date),
        anchor: anchorAt(at),
        isMinor,
      },
    ];
  });
}

// A text at an edge of the plot runs inward, so it never sticks out of the chart.
function anchorAt(at: PlotFraction): TextAnchor {
  if (at === 0) {
    return "start";
  }
  return at === 1 ? "end" : "middle";
}

/** The index of the date nearest to a position across the plot, such as where a pointer or a finger is, among a number of dates. */
export function indexAt(across: PlotFraction, count: number): number {
  if (count <= 1) {
    return 0;
  }
  return Math.min(count - 1, Math.max(0, Math.round(across * (count - 1))));
}
