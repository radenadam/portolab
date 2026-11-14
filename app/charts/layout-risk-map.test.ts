import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { portfolioWeight } from "~/units/portfolio-weight";
import { layoutRiskMap } from "./layout-risk-map";
import type {
  MapMark,
  MapPoint,
  MarkedPoint,
  RiskMapLayout,
} from "./layout-risk-map";

// The IHSG lies at a beta of 1 and a return of 1%, and the line starts at a beta of 0 and a return of 0.5%, so it rises by 0.5% for each step of beta. The betas reach from 0 to 2, which a padding of 8% of their spread widens to -0.16 to 2.16, and the axis starts at zero, because no beta lies below it. The line ends at the right edge at 0.5% + 2.16 × 0.5% = 1.58%. The returns, with zero and the ends of the line, reach from -1% to 3%, which the padding widens to -1.32% to 3.32%, a range of 4.64%. So a beta b lies at b / 2.16 across the plot, and a return r at (3.32% - r) / 4.64% down it.
function across(value: number): number {
  return value / 2.16;
}

function down(value: number): number {
  return (0.0332 - value) / 0.0464;
}

function mapPoint(
  key: string,
  values: { beta: number; return: number },
): MapPoint<Beta, MonthlyReturn> {
  return {
    key,
    name: key,
    across: beta(values.beta),
    up: monthlyReturn(values.return),
    values: [],
  };
}

function markedPoint(
  key: string,
  values: { beta: number; return: number },
  mark: MapMark,
): MarkedPoint<Beta, MonthlyReturn> {
  return { ...mapPoint(key, values), mark };
}

const market = mapPoint("IHSG", { beta: 1, return: 0.01 });
const points = [
  markedPoint("portfolio", { beta: 0.5, return: 0.02 }, { kind: "own" }),
  markedPoint(
    "BBCA",
    { beta: 1.5, return: -0.01 },
    { kind: "held", weight: portfolioWeight(0.25) },
  ),
  markedPoint("TLKM", { beta: 2, return: 0.03 }, { kind: "other" }),
];
const axes = {
  across: { style: "decimal", toValue: beta },
  up: { style: "percent", toValue: monthlyReturn },
} as const;
const line = {
  name: "SML",
  start: { across: beta(0), up: monthlyReturn(0.005) },
};

function layout(
  mapPoints: readonly MarkedPoint<Beta, MonthlyReturn>[],
): RiskMapLayout<MarkedPoint<Beta, MonthlyReturn>> {
  return layoutRiskMap({ market, points: mapPoints, ...axes, line });
}

test("places each point by its risk across and its return up, in ranges that hold the IHSG, the line, and a return of zero, with the axis of risk starting at zero", () => {
  const map = layout(points);
  expect(map.market.position.x).toBeCloseTo(across(1), 12);
  expect(map.market.position.y).toBeCloseTo(down(0.01), 12);
  for (const [index, { point, placed }] of map.points.entries()) {
    expect(point).toBe(points[index]);
    expect(placed.position.x).toBeCloseTo(across(point.across), 12);
    expect(placed.position.y).toBeCloseTo(down(point.up), 12);
  }
  expect(map.line.start.x).toBe(0);
  expect(map.line.start.y).toBeCloseTo(down(0.005), 12);
  expect(map.line.end.x).toBe(1);
  expect(map.line.end.y).toBeCloseTo(down(0.0158), 12);
});

test("starts the axis of risk below zero when a point lies below zero, such as a stock with a negative beta", () => {
  // The betas reach from -0.5 to 1, which the padding widens to -0.62 to 1.12.
  const map = layout([
    markedPoint("ANTM", { beta: -0.5, return: 0.01 }, { kind: "other" }),
  ]);
  expect(map.market.position.x).toBeCloseTo((1 + 0.62) / 1.74, 12);
  expect(map.line.start.x).toBeCloseTo(0.62 / 1.74, 12);
});

test("sizes the dot of a stock that the portfolio holds by the root of its weight, keeps the smallest size for a small weight and for a stock without a weight, and rings the point of the reader", () => {
  const radii = layout([
    markedPoint("own", { beta: 1, return: 0 }, { kind: "own" }),
    ...[0.5, 0.25, 0.05].map((weight) =>
      markedPoint(
        String(weight),
        { beta: 1, return: 0 },
        { kind: "held", weight: portfolioWeight(weight) },
      ),
    ),
    markedPoint(
      "unweighted",
      { beta: 1, return: 0 },
      { kind: "held", weight: undefined },
    ),
    markedPoint("other", { beta: 1, return: 0 }, { kind: "other" }),
  ]).points.map(({ placed }) => [placed.radius, placed.outerRadius]);
  // A weight w gives a radius of 0.175 times the root of w in percent, so 50% gives 1.2374 and 25% gives 0.875, and 5% gives 0.3913, below the smallest radius of 0.46.
  expect(radii).toEqual([
    [0.67, 1.04],
    [expect.closeTo(1.2374, 4), expect.closeTo(1.2374, 4)],
    [expect.closeTo(0.875, 4), expect.closeTo(0.875, 4)],
    [0.46, 0.46],
    [0.46, 0.46],
    [0.42, 0.42],
  ]);
  expect(layout(points).market).toMatchObject({
    radius: 0.58,
    outerRadius: 0.58,
  });
});

const tickTexts: Record<
  Locale,
  { across: readonly string[]; up: readonly string[] }
> = {
  id: { across: ["0,0", "0,5", "1,0", "1,5", "2,0"], up: ["0%", "2%"] },
  en: { across: ["0.0", "0.5", "1.0", "1.5", "2.0"], up: ["0%", "2%"] },
};

for (const locale of locales) {
  test(`marks the axes at round values with the decimals that they need, the risk of the IHSG strongly, every other mark of risk from it as minor, and zero on the axis of returns, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // About ten steps over 2.16 need a step of at least 0.216, so the step of risk is 0.5. About four steps over 4.64% need at least 1.16%, so the step of returns is 2%.
    const map = layout(points);
    expect(
      map.acrossTicks.map(({ text, isMarket, isMinor }) => ({
        text,
        isMarket,
        isMinor,
      })),
    ).toEqual(
      [0, 0.5, 1, 1.5, 2].map((value, index) => ({
        text: tickTexts[locale].across[index],
        isMarket: value === 1,
        isMinor: value === 0.5 || value === 1.5,
      })),
    );
    for (const [index, value] of [0, 0.5, 1, 1.5, 2].entries()) {
      expect(map.acrossTicks[index]?.at).toBeCloseTo(across(value), 12);
    }
    expect(map.upTicks.map(({ text, isZero }) => ({ text, isZero }))).toEqual([
      { text: tickTexts[locale].up[0], isZero: true },
      { text: tickTexts[locale].up[1], isZero: false },
    ]);
    for (const [index, value] of [0, 0.02].entries()) {
      expect(map.upTicks[index]?.at).toBeCloseTo(down(value), 12);
    }
    expect(map.upTextLength).toBe(2);
  });
}

test("counts the minor marks of risk from the first mark when the risk of the IHSG falls between marks", () => {
  // The betas reach from 0 to 3, which the padding widens to 3.24, so the step is 0.5, and the IHSG lies at 0.7, between the marks.
  const map = layoutRiskMap({
    market: mapPoint("IHSG", { beta: 0.7, return: 0.01 }),
    points: [markedPoint("ANTM", { beta: 3, return: 0.01 }, { kind: "other" })],
    ...axes,
    line,
  });
  expect(
    map.acrossTicks.map(({ isMarket, isMinor }) => ({ isMarket, isMinor })),
  ).toEqual(
    [false, true, false, true, false, true, false].map((isMinor) => ({
      isMarket: false,
      isMinor,
    })),
  );
});

test("offers places for the label of the line at the return of the IHSG along that line from its left end, above it and then below it, and for the label of the line around its right end", () => {
  const map = layout(points);
  const level = { x: 0, y: map.market.position.y };
  expect(map.linePlaces.level.slice(0, 4)).toEqual([
    { at: level, dx: 0.83, dy: -0.5, anchor: "start" },
    { at: level, dx: 0.83, dy: 1.17, anchor: "start" },
    { at: level, dx: 3.5, dy: -0.5, anchor: "start" },
    { at: level, dx: 3.5, dy: 1.17, anchor: "start" },
  ]);
  expect(map.linePlaces.level).toHaveLength(18);
  expect(map.linePlaces.line).toEqual([
    { at: map.line.end, dx: -0.33, dy: -0.67, anchor: "end" },
    { at: map.line.end, dx: -0.33, dy: 1.33, anchor: "end" },
    { at: map.line.end, dx: -3.33, dy: 1.33, anchor: "end" },
  ]);
});

test("refuses a line that starts at the risk of the IHSG, because it has no direction", () => {
  expect(() =>
    layoutRiskMap({
      market,
      points,
      ...axes,
      line: { name: "SML", start: { across: beta(1), up: monthlyReturn(0) } },
    }),
  ).toThrow(
    "The line of the map starts at the risk of the IHSG, 1, so it has no direction.",
  );
});

const barelyMovingTexts: Record<Locale, readonly string[]> = {
  id: ["0%"],
  en: ["0%"],
};

for (const locale of locales) {
  test(`writes each mark of returns apart from the others when the returns spread less than a hundredth of a percent, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // The returns, the line, and zero reach from 0% to 0.003%, so the marks stand a hundredth of a percent apart at the least, and only the mark at 0% lies in their range.
    const map = layoutRiskMap({
      market: mapPoint("IHSG", { beta: 1, return: 0.00002 }),
      points: [
        markedPoint(
          "portfolio",
          { beta: 0.5, return: 0.00003 },
          { kind: "own" },
        ),
      ],
      ...axes,
      line: {
        name: "SML",
        start: { across: beta(0), up: monthlyReturn(0.00001) },
      },
    });
    expect(map.upTicks.map((tick) => tick.text)).toEqual(
      barelyMovingTexts[locale],
    );
  });
}
