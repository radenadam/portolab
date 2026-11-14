import {
  axisMarkFormat,
  smallestNumberStep,
  smallestPercentStep,
} from "~/formatting";
import type { AxisStyle, SignedChange } from "~/formatting";
import { plotFraction } from "~/units/plot-fraction";
import type { PlotFraction } from "~/units/plot-fraction";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { LabelPlace } from "./map-labels";
import type { PlotPosition } from "./plot";
import { fractionOf, niceTicks, paddedRange } from "./scale";
import type { Range } from "./scale";

/** How the map draws a point other than the IHSG, as decision 0035 sets: the point that the map is about, which is the reader's own portfolio or the one that the reader opened, in the color of the reader's own point with a ring around it, a stock that the portfolio holds as a filled dot whose area grows with its weight, and any other stock as a hollow dot. A holding without a weight, such as one of a portfolio without measures, takes the size of the smallest weight. */
export type MapMark =
  | { kind: "own" }
  | { kind: "held"; weight: PortfolioWeight | undefined }
  | { kind: "other" }
  | { kind: "active" };

/** A value that the tooltip of a point shows and a screen reader reads: the name of a measure with its value, as a text or as a change with a sign. */
export interface MapValue {
  name: string;
  value: string | SignedChange;
}

/** A point of the map with its risk across and its return up. */
export interface MapPoint<Across extends number, Up extends number> {
  /** Unique among the points of a map, such as the code of a stock. */
  key: string;
  /** The name beside the point and at the head of its tooltip. */
  name: string;
  /** A shorter name beside the mark, or an empty text when only the tooltip names it. */
  label?: string;
  /** The page that opens when the reader activates this point. */
  href?: string;
  across: Across;
  up: Up;
  values: readonly MapValue[];
}

/** A point of the map with how its mark is drawn. */
export type MarkedPoint<Across extends number, Up extends number> = MapPoint<
  Across,
  Up
> & { mark: MapMark };

/** An axis of the map: how its marks write their values, and the unit of the values. */
export interface MapAxis<Value extends number> {
  style: AxisStyle;
  toValue: (value: number) => Value;
}

/** A straight line that runs from a point, such as the risk-free rate at a beta of 0, through the IHSG to the right edge of the plot, such as the security market line. */
export interface MapLine<Across extends number, Up extends number> {
  name: string;
  start: { across: Across; up: Up };
}

/** A mark of the axis of risk: where it stands across the plot, its text, whether it marks the risk of the IHSG, which the map draws stronger, and whether it is minor, which a narrow map leaves without its text. */
interface AcrossTick {
  at: PlotFraction;
  text: string;
  isMarket: boolean;
  isMinor: boolean;
}

/** A mark of the axis of returns: its height in the plot, its text, and whether it marks zero, which separates gains from losses. */
interface UpTick {
  at: PlotFraction;
  text: string;
  isZero: boolean;
}

/** A mark of the map: the position of its point, the radius of its dot or half the diagonal of the diamond of the IHSG, and the radius of the circle that holds all that the mark draws, such as the ring around the point of the reader, which labels keep clear of. The radii are in sizes of the text of the labels. */
export interface PlacedMark {
  position: PlotPosition;
  radius: number;
  outerRadius: number;
}

/** Where the map draws each of its parts in its plot. */
export interface RiskMapLayout<Point> {
  /** The marks of the axis of risk at round values, from the lowest. */
  acrossTicks: AcrossTick[];
  /** The marks of the axis of returns at round values, from the lowest. */
  upTicks: UpTick[];
  /** The characters of the longest text of a mark of returns. DM Mono, the font of the marks of axes, draws each character equally wide, so the plot leaves this many widths of a character for the texts. */
  upTextLength: number;
  market: PlacedMark;
  zero: PlotFraction;
  median: PlotFraction | undefined;
  line: { start: PlotPosition; end: PlotPosition };
  /** Each point with its mark, in the order of the points. */
  points: { point: Point; placed: PlacedMark }[];
  /** The places of the label of the line of the return of the IHSG and of the label of the line, in order of preference. */
  linePlaces: { level: LabelPlace[]; line: LabelPlace[] };
}

// About ten marks fit across a wide map, as the references of decision 0028 draw them, and a narrow map shows every other one. Four fit up a map at the height of a phone.
const acrossTickCount = 10;
const upTickCount = 4;
// The corner labels need a band above and below the class points, also on a phone.
const cornerPadding = 0.2;

const smallestSteps: Record<AxisStyle, number> = {
  decimal: smallestNumberStep,
  percent: smallestPercentStep,
};

// The sizes of the marks of the prototype of decision 0028, at 12 pixels to the size of the text of the labels. A dot of a stock that the portfolio holds grows in area with its weight, from the size of a weight of about 7% down.
const marketRadius = 0.58;
const ownRadius = 0.67;
const ownRingRadius = 1.04;
const otherRadius = 0.42;
const smallestHeldRadius = 0.46;
const heldRadiusPerRootPercent = 0.175;

// The label of the line of the return of the IHSG tries places along the line from its left end, above the line and then below it, so it names the line where no point lies. The label of the line sits above the end of the line, or below it, as the prototype of decision 0028 places them.
const levelStart = 0.83;
const levelStep = 2.67;
const levelSteps = 8;
const levelAbove = -0.5;
const levelBelow = 1.17;
const lineEndPlaces = [
  { dx: -0.33, dy: -0.67 },
  { dx: -0.33, dy: 1.33 },
  { dx: -3.33, dy: 1.33 },
];

/** Lays out the map: the risk of every point, of the IHSG, and of the start of the line across, and their returns up, on axes that mark round values, with zero on the axis of returns. An axis whose values are never below zero, such as beta or a standard deviation, starts at zero at the lowest. */
export function layoutRiskMap<
  Across extends number,
  Up extends number,
  Point extends MarkedPoint<Across, Up>,
>(map: {
  market: MapPoint<Across, Up>;
  points: readonly Point[];
  across: MapAxis<Across>;
  up: MapAxis<Up>;
  line?: MapLine<Across, Up> | undefined;
  median?: Up;
  roomForCorners?: boolean;
}): RiskMapLayout<Point> {
  const { market, points, across, up } = map;
  const line = map.line ?? {
    name: "",
    start: { across: across.toValue(0), up: market.up },
  };
  const acrossRange = rangeOf(
    [
      ...[market, ...points].map((point) => point.across),
      ...(map.line === undefined ? [] : [map.line.start.across]),
    ],
    across.toValue,
  );
  if (map.line !== undefined && market.across === line.start.across) {
    throw new Error(
      `The line of the map starts at the risk of the IHSG, ${String(market.across)}, so it has no direction.`,
    );
  }
  const slope =
    map.line === undefined
      ? 0
      : (market.up - line.start.up) / (market.across - line.start.across);
  const lineEnd = up.toValue(
    line.start.up + (acrossRange.max - line.start.across) * slope,
  );
  const upRange = rangeOf(
    [
      ...[market, ...points, line.start].map((point) => point.up),
      up.toValue(0),
      lineEnd,
      ...(map.median === undefined ? [] : [map.median]),
    ],
    up.toValue,
    map.roomForCorners === true,
  );
  const positionOf = (point: { across: Across; up: Up }): PlotPosition => ({
    x: plotFraction(fractionOf(acrossRange, point.across)),
    y: heightOf(upRange, point.up),
  });
  const upValues = ticksOf(upRange, upTickCount, up);
  const upFormat = axisMarkFormat(upValues, up.style);
  const upTicks = upValues.map((value) => ({
    at: heightOf(upRange, value),
    text: upFormat(value),
    isZero: value === 0,
  }));
  let upTextLength = 0;
  for (const tick of upTicks) {
    upTextLength = Math.max(upTextLength, tick.text.length);
  }
  const marketPosition = positionOf(market);
  const end = positionOf({ across: acrossRange.max, up: lineEnd });
  return {
    acrossTicks: acrossTicksOf(acrossRange, across, market.across),
    upTicks,
    upTextLength,
    zero: heightOf(upRange, up.toValue(0)),
    median:
      map.median === undefined ? undefined : heightOf(upRange, map.median),
    market: {
      position: marketPosition,
      radius: marketRadius,
      outerRadius: marketRadius,
    },
    line:
      map.line === undefined
        ? { start: marketPosition, end: marketPosition }
        : { start: positionOf(line.start), end },
    points: points.map((point) => ({
      point,
      placed: { position: positionOf(point), ...markSizeOf(point.mark) },
    })),
    linePlaces: {
      level: levelPlaces(marketPosition.y),
      line: lineEndPlaces.map(({ dx, dy }) => ({
        at: end,
        dx,
        dy,
        anchor: "end",
      })),
    },
  };
}

function levelPlaces(height: PlotFraction): LabelPlace[] {
  const at = { x: plotFraction(0), y: height };
  const places: LabelPlace[] = [];
  for (let step = 0; step <= levelSteps; step += 1) {
    const dx = levelStart + step * levelStep;
    places.push(
      { at, dx, dy: levelAbove, anchor: "start" },
      { at, dx, dy: levelBelow, anchor: "start" },
    );
  }
  return places;
}

function heightOf<Up extends number>(
  range: Range<Up>,
  value: Up,
): PlotFraction {
  return plotFraction(1 - fractionOf(range, value));
}

function rangeOf<Value extends number>(
  values: readonly Value[],
  toValue: (value: number) => Value,
  roomForCorners = false,
): Range<Value> {
  return paddedRange(values, toValue, {
    paddingShare: roomForCorners ? cornerPadding : undefined,
    minimum:
      !roomForCorners && Math.min(...values) >= 0 ? toValue(0) : undefined,
  });
}

function ticksOf<Value extends number>(
  range: Range<Value>,
  count: number,
  axis: MapAxis<Value>,
): Value[] {
  return niceTicks(
    range,
    { count, smallestStep: smallestSteps[axis.style] },
    axis.toValue,
  );
}

// Every other mark is minor, counted from the mark of the risk of the IHSG, so a narrow map keeps that mark with its text, or counted from the first mark when that risk falls between marks.
function acrossTicksOf<Across extends number>(
  range: Range<Across>,
  axis: MapAxis<Across>,
  marketValue: Across,
): AcrossTick[] {
  const values = ticksOf(range, acrossTickCount, axis);
  const format = axisMarkFormat(values, axis.style);
  const marketIndex = values.findIndex((value) =>
    isSameValue(value, marketValue),
  );
  return values.map((value, index) => ({
    at: plotFraction(fractionOf(range, value)),
    text: format(value),
    isMarket: index === marketIndex,
    isMinor: (index - Math.max(marketIndex, 0)) % 2 !== 0,
  }));
}

// A mark is a multiple of a step such as 0.2, which is not exact in binary, so it marks a value that lies within a billionth of it.
function isSameValue(first: number, second: number): boolean {
  return Math.abs(first - second) < 1e-9;
}

function markSizeOf(mark: MapMark): { radius: number; outerRadius: number } {
  switch (mark.kind) {
    case "own":
      return { radius: ownRadius, outerRadius: ownRingRadius };
    case "held": {
      const radius =
        mark.weight === undefined
          ? smallestHeldRadius
          : Math.max(
              smallestHeldRadius,
              heldRadiusPerRootPercent * Math.sqrt(mark.weight * 100),
            );
      return { radius, outerRadius: radius };
    }
    case "active":
    case "other":
      return { radius: otherRadius, outerRadius: otherRadius };
  }
}
