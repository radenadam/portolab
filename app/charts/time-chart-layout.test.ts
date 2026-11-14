import { expect, test } from "vitest";
import { addDays } from "~/calendar-dates";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { plotFraction } from "~/units/plot-fraction";
import { indexAt, layoutTimeChart } from "./time-chart-layout";
import type { TimeChartLayout } from "./time-chart-layout";
import { returnPointsForTest } from "./return-points-for-test";

// The returns of returnPointsForTest reach from -0.030704 to 0.0078662461, which a padding of 8% of their spread widens to -0.0337896197 to 0.0109518658, a range of 0.0447414855. Four steps over that range need a step of at least 1.1185%, so the marks stand at -2% and 0%. A return r lies at (0.0109518658 - r) / 0.0447414855 of the height of the plot from its top.
const dates = returnPointsForTest.map((point) => point.date);
const portfolio = returnPointsForTest.map((point) => point.portfolio);
const market = returnPointsForTest.map((point) => point.market);

function heightOf(value: number): number {
  return (0.0109518658 - value) / 0.0447414855;
}

test("places each return of each line by its date across the plot and by its value down the plot, on one axis for every line", () => {
  const layout = layoutTimeChart(dates, [
    { kind: "own", returns: portfolio },
    { kind: "reference", returns: market },
  ]);
  expect(layout.lines.map((line) => line.kind)).toEqual(["own", "reference"]);
  for (const [lineIndex, returns] of [portfolio, market].entries()) {
    const positions = layout.lines[lineIndex]?.positions ?? [];
    expect(positions.map((position) => position.x)).toEqual([0, 0.5, 1]);
    for (const [index, value] of returns.entries()) {
      expect(positions[index]?.y).toBeCloseTo(heightOf(value), 6);
    }
  }
  expect(layout.returnTicks.map((tick) => tick.isZero)).toEqual([false, true]);
  expect(layout.returnTicks[0]?.at).toBeCloseTo(heightOf(-0.02), 6);
  expect(layout.returnTicks[1]?.at).toBeCloseTo(heightOf(0), 6);
});

const tickTexts: Record<
  Locale,
  { returns: readonly string[]; dates: readonly string[] }
> = {
  id: {
    returns: ["-0,5%", "0%", "+0,5%", "+1%"],
    dates: ["30 Okt", "2 Nov", "3 Nov"],
  },
  en: {
    returns: ["-0.5%", "0%", "+0.5%", "+1%"],
    dates: ["Oct 30", "Nov 2", "Nov 3"],
  },
};

for (const locale of locales) {
  test(`writes the marks of returns with a sign and the decimals that they need, the marks of dates with the day and the short month, and leaves room for the longest mark of returns, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // The returns reach from -0.4% to 1%, which a padding of 0.112% widens to -0.512% to 1.112%. Four steps need a step of at least 0.406%, so the step is 0.5%.
    const layout = layoutTimeChart(dates, [
      { kind: "own", returns: [0, 0.01, -0.004].map(cumulativeReturn) },
    ]);
    expect(layout.returnTicks.map((tick) => tick.text)).toEqual(
      tickTexts[locale].returns,
    );
    expect(layout.returnTextLength).toBe(5);
    expect(layout.dateTicks.map((tick) => tick.text)).toEqual(
      tickTexts[locale].dates,
    );
  });
}

/** Where each mark of dates stands and sits, without its text, which depends on the language. */
function tickPlaces(
  layout: TimeChartLayout,
): { at: number; anchor: string; isMinor: boolean }[] {
  return layout.dateTicks.map(({ at, anchor, isMinor }) => ({
    at,
    anchor,
    isMinor,
  }));
}

test("marks five dates evenly across a long chart, the second and the fourth of them minor, with the first starting at the left edge and the last ending at the right edge", () => {
  const manyDates: string[] = [];
  const returns: CumulativeReturn[] = [];
  for (let index = 0; index < 100; index += 1) {
    manyDates.push(addDays("2026-07-01", index));
    returns.push(cumulativeReturn(index / 1000));
  }
  const layout = layoutTimeChart(manyDates, [{ kind: "own", returns }]);
  // The marks fall on the dates at 0, 24.75, 49.5, 74.25, and 99, rounded, of the 99 steps between the first date and the last.
  expect(tickPlaces(layout)).toEqual([
    { at: 0, anchor: "start", isMinor: false },
    { at: 25 / 99, anchor: "middle", isMinor: true },
    { at: 50 / 99, anchor: "middle", isMinor: false },
    { at: 74 / 99, anchor: "middle", isMinor: true },
    { at: 1, anchor: "end", isMinor: false },
  ]);
});

test("keeps a date a major mark when a minor mark falls on it too, so a short chart shows every date that it marks", () => {
  // Of two dates, the marks at 0 and 0.25 round to the first date, and the marks at 0.5, 0.75, and 1 round to the second.
  const layout = layoutTimeChart(dates.slice(0, 2), [
    { kind: "own", returns: [0, 0.01].map(cumulativeReturn) },
  ]);
  expect(tickPlaces(layout)).toEqual([
    { at: 0, anchor: "start", isMinor: false },
    { at: 1, anchor: "end", isMinor: false },
  ]);
});

const barelyMovingTexts: Record<Locale, readonly string[]> = {
  id: ["0%"],
  en: ["0%"],
};

for (const locale of locales) {
  test(`writes each mark of returns apart from the others when the returns move by less than a hundredth of a percent, such as a portfolio of cash against an IHSG that barely moved, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // The returns reach from 0% to 0.005%, so the marks stand a hundredth of a percent apart at the least, and only the mark at 0% lies in their range.
    const layout = layoutTimeChart(dates.slice(0, 2), [
      { kind: "own", returns: [0, 0].map(cumulativeReturn) },
      { kind: "reference", returns: [0, 0.00005].map(cumulativeReturn) },
    ]);
    expect(layout.returnTicks.map((tick) => tick.text)).toEqual(
      barelyMovingTexts[locale],
    );
    expect(layout.returnTicks.map((tick) => tick.isZero)).toEqual([true]);
  });
}

test("puts the one return of a chart of one date at the right edge, where every other chart has its latest return, around a range of zero", () => {
  const layout = layoutTimeChart(dates.slice(0, 1), [
    { kind: "own", returns: [cumulativeReturn(0)] },
    { kind: "reference", returns: [cumulativeReturn(0)] },
  ]);
  expect(layout.lines.map((line) => line.positions)).toEqual([
    [{ x: 1, y: 0.5 }],
    [{ x: 1, y: 0.5 }],
  ]);
  expect(tickPlaces(layout)).toEqual([
    { at: 1, anchor: "end", isMinor: false },
  ]);
  expect(layout.returnTicks.map((tick) => tick.at)).toEqual([1, 0.5, 0]);
});

test("finds the date nearest to a position across the plot, and the first or the last date beyond an edge", () => {
  expect(indexAt(plotFraction(0), 5)).toBe(0);
  expect(indexAt(plotFraction(0.12), 5)).toBe(0);
  expect(indexAt(plotFraction(0.13), 5)).toBe(1);
  expect(indexAt(plotFraction(1), 5)).toBe(4);
  expect(indexAt(plotFraction(-0.3), 5)).toBe(0);
  expect(indexAt(plotFraction(1.3), 5)).toBe(4);
  expect(indexAt(plotFraction(0.7), 1)).toBe(0);
});
