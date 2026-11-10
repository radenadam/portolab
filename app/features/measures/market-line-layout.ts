import { formatNumber, formatPercent } from "~/formatting";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { pixels } from "~/units/pixels";
import type { Pixels } from "~/units/pixels";
import { requiredReturnOn } from "./capm";
import type { MarketLine } from "./capm";
import { placePointLabels, textWidth } from "./point-labels";
import type { PlacedLabel, PointLabel, Position } from "./point-labels";

/** The size of the frame of a chart and of the text in it. */
export interface ChartFrame {
  width: Pixels;
  height: Pixels;
  fontSize: Pixels;
}

/** The kinds of point on the chart of the security market line, each with a mark of its own. */
export type PointKind =
  "riskFree" | "market" | "portfolio" | "holding" | "otherStock";

/** A point that the chart places, named uniquely among the points, such as by the code of a stock, with its label, or without one for a point among many, such as a stock that the portfolio does not hold. */
export interface ChartPoint {
  name: string;
  kind: PointKind;
  beta: Beta;
  expectedReturn: MonthlyReturn;
  label: PointLabel | undefined;
}

/** A mark of an axis at a value, with the text that names the value and the point where that text sits on its baseline. */
interface AxisTick {
  position: Pixels;
  text: string;
  textAt: Position;
}

/** Where the chart draws each of its parts in its frame. */
export interface ChartLayout {
  plot: { left: Pixels; right: Pixels; top: Pixels; bottom: Pixels };
  /** The text of each mark of the axis of betas has its middle at the point of the text. */
  betaTicks: AxisTick[];
  /** The text of each mark of the axis of returns ends at the point of the text. */
  returnTicks: AxisTick[];
  /** The point of the title of each axis on its baseline: the start of the title of the returns, and the middle of the title of the betas. */
  titles: { expectedReturn: Position; beta: Position };
  line: { start: Position; end: Position };
  /** Each point with the radius of its mark, in the order of the points. */
  points: (Position & { name: string; kind: PointKind; radius: Pixels })[];
  /** Each label that has room beside its point. The table of the points names every point, so a label without room is left out. */
  labels: PlacedLabel[];
}

// Every length of the chart is a multiple of the size of its text, so the chart keeps its proportions when a reader enlarges the text.
const textMiddle = 0.35;
const tickLabelGap = 0.5;
const margins = { top: 2, bottom: 3, right: 1.5 };
const titleBaselines = { top: 1, bottom: 0.4 };
const betaTextBaseline = 1.25;
const tickSpacing = { beta: 4, expectedReturn: 2.5 };
/** The radius of the mark of each kind of point, in sizes of the text of the chart. The mark of the portfolio is the largest, so it stands out among the stocks. */
export const markRadii: Record<PointKind, number> = {
  riskFree: 0.3,
  market: 0.3,
  portfolio: 0.5,
  holding: 0.3,
  otherStock: 0.25,
};
// A point at the edge of the range keeps a part of the range between it and the axis, and a range of returns without any spread still needs a height.
const rangePadding = 0.08;
const emptyRangePadding = 0.005;

/** Lays out the chart of a security market line and of its points in a frame: the line from the smallest to the largest beta, the axes with marks at round values, and the label of each point where it has room. */
export function layoutMarketLineChart(
  line: MarketLine,
  points: readonly ChartPoint[],
  frame: ChartFrame,
): ChartLayout {
  const em = frame.fontSize;
  const betas = paddedRange(
    points.map((point) => point.beta),
    beta,
  );
  const lineStart = requiredReturnOn(line, betas.min);
  const lineEnd = requiredReturnOn(line, betas.max);
  const expectedReturns = paddedRange(
    [...points.map((point) => point.expectedReturn), lineStart, lineEnd],
    monthlyReturn,
  );
  const top = pixels(em * margins.top);
  const bottom = pixels(frame.height - em * margins.bottom);
  const returnValues = ticksOf(
    expectedReturns,
    tickCount(bottom - top, em * tickSpacing.expectedReturn),
    monthlyReturn,
  ).map((value) => ({ value, text: formatPercent(value) }));
  const textEnd = pixels(em * widestText(returnValues));
  const left = pixels(textEnd + em * tickLabelGap);
  const right = pixels(frame.width - em * margins.right);
  const plot = { left, right, top, bottom };
  const horizontal = scale(betas, { from: left, to: right });
  const vertical = scale(expectedReturns, { from: bottom, to: top });
  const drawnLine = {
    start: { x: left, y: vertical(lineStart) },
    end: { x: right, y: vertical(lineEnd) },
  };
  const placed = points.map((point) => ({
    name: point.name,
    kind: point.kind,
    label: point.label,
    x: horizontal(point.beta),
    y: vertical(point.expectedReturn),
    radius: pixels(em * markRadii[point.kind]),
  }));
  return {
    plot,
    betaTicks: ticksOf(
      betas,
      tickCount(right - left, em * tickSpacing.beta),
      beta,
    ).map((value) => {
      const position = horizontal(value);
      return {
        position,
        text: formatNumber(value),
        textAt: { x: position, y: pixels(bottom + em * betaTextBaseline) },
      };
    }),
    returnTicks: returnValues.map(({ value, text }) => {
      const position = vertical(value);
      return {
        position,
        text,
        textAt: { x: textEnd, y: pixels(position + em * textMiddle) },
      };
    }),
    titles: {
      expectedReturn: { x: pixels(0), y: pixels(em * titleBaselines.top) },
      beta: {
        x: pixels((left + right) / 2),
        y: pixels(frame.height - em * titleBaselines.bottom),
      },
    },
    line: drawnLine,
    points: placed.map(({ name, kind, x, y, radius }) => ({
      name,
      kind,
      x,
      y,
      radius,
    })),
    labels: placePointLabels(placed, { area: plot, line: drawnLine }, em),
  };
}

interface Range<Value extends number> {
  min: Value;
  max: Value;
}

function paddedRange<Value extends number>(
  values: readonly Value[],
  toValue: (value: number) => Value,
): Range<Value> {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = max > min ? (max - min) * rangePadding : emptyRangePadding;
  return { min: toValue(min - padding), max: toValue(max + padding) };
}

function tickCount(length: number, spacing: number): number {
  // An axis keeps two marks on a frame too small for them, so it still shows its scale.
  return Math.max(2, Math.floor(length / spacing));
}

/** The round values in a range for about a number of marks: the multiples of a step of 1, 2, or 5 times a power of ten. */
function ticksOf<Value extends number>(
  range: Range<Value>,
  count: number,
  toValue: (value: number) => Value,
): Value[] {
  const roughStep = (range.max - range.min) / count;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const step =
    [1, 2, 5]
      .map((multiple) => multiple * power)
      .find((candidate) => candidate >= roughStep) ?? 10 * power;
  const ticks: Value[] = [];
  for (
    let index = Math.ceil(range.min / step);
    index * step <= range.max;
    index += 1
  ) {
    // Math.ceil gives -0 for a value just below zero, which Intl writes as -0.
    ticks.push(toValue(index === 0 ? 0 : index * step));
  }
  return ticks;
}

/** The width of the widest text, in sizes of the text. */
function widestText(texts: readonly { text: string }[]): number {
  let widest = 0;
  for (const { text } of texts) {
    widest = Math.max(widest, textWidth(text));
  }
  return widest;
}

function scale<Value extends number>(
  range: Range<Value>,
  screen: { from: Pixels; to: Pixels },
): (value: Value) => Pixels {
  return (value) =>
    pixels(
      screen.from +
        ((value - range.min) / (range.max - range.min)) *
          (screen.to - screen.from),
    );
}
