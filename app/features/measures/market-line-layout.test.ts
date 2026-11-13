import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import { pixels } from "~/units/pixels";
import { layoutMarketLineChart } from "./market-line-layout";
import type { ChartPoint } from "./market-line-layout";

// A line from a risk-free rate of 0.5% at a beta of 0 through 1% at a beta of 1, the portfolio at a beta of 0.5 and 2%, and a stock at a beta of 1.5 and -1%, in a frame of 328 by 256 pixels with text of 10 pixels. The expected positions were computed by hand:
// - The betas reach from 0 to 1.5, which a padding of 8% of their range of 1.5 widens to -0.12 to 1.62. The line has 0.44% at -0.12 and 1.31% at 1.62, so the returns reach from -1% to 2%, which the padding widens to -1.24% to 2.24%.
// - The plot starts 2 sizes of text below the top, at 20, and ends 3 sizes above the bottom, at 226. Its 206 pixels hold 8 marks 2.5 sizes apart, so the step of 0.0348 / 8 rounds up to 0.5%, which gives the marks from -1% to 2%.
// - The widest mark of the returns, -0.5%, has 5 characters of 0.6 sizes, so the texts end at 30 and the plot starts half a size later, at 35. It ends 1.5 sizes before the right, at 313. Its 278 pixels hold 6 marks 4 sizes apart, so the step of 1.74 / 6 rounds up to 0.5, which gives the marks from 0 to 1.5.
// - A beta b lies at 35 + (b + 0.12) / 1.74 × 278, and a return r at 226 - (r + 0.0124) / 0.0348 × 206.
const frame = { width: pixels(328), height: pixels(256), fontSize: pixels(10) };
const line = {
  riskFreeRate: monthlyReturn(0.005),
  marketExpectedReturn: monthlyReturn(0.01),
};
const points: ChartPoint[] = [
  {
    name: "riskFree",
    kind: "riskFree",
    beta: beta(0),
    expectedReturn: monthlyReturn(0.005),
    label: { text: "R", subscript: "f" },
  },
  {
    name: "market",
    kind: "market",
    beta: beta(1),
    expectedReturn: monthlyReturn(0.01),
    label: { text: "M", subscript: "" },
  },
  {
    name: "portfolio",
    kind: "portfolio",
    beta: beta(0.5),
    expectedReturn: monthlyReturn(0.02),
    label: { text: "p", subscript: "" },
  },
  {
    name: "BBCA",
    kind: "holding",
    beta: beta(1.5),
    expectedReturn: monthlyReturn(-0.01),
    label: { text: "BBCA", subscript: "" },
  },
  {
    name: "TLKM",
    kind: "otherStock",
    beta: beta(1),
    expectedReturn: monthlyReturn(0),
    label: undefined,
  },
];

function horizontal(value: number): number {
  return 35 + ((value + 0.12) / 1.74) * 278;
}

function vertical(value: number): number {
  return 226 - ((value + 0.0124) / 0.0348) * 206;
}

const tickTexts: Record<
  Locale,
  { betas: readonly string[]; returns: readonly string[] }
> = {
  id: {
    betas: ["0", "0,5", "1", "1,5"],
    returns: ["-1%", "-0,5%", "0%", "0,5%", "1%", "1,5%", "2%"],
  },
  en: {
    betas: ["0", "0.5", "1", "1.5"],
    returns: ["-1%", "-0.5%", "0%", "0.5%", "1%", "1.5%", "2%"],
  },
};

test("places the plot, the line, and each point by the sizes of the frame and of its text, with every point inside the plot", () => {
  const layout = layoutMarketLineChart(line, points, frame);
  expect(layout.plot).toEqual({ left: 35, right: 313, top: 20, bottom: 226 });
  expect(layout.line.start.x).toBe(35);
  expect(layout.line.start.y).toBeCloseTo(vertical(0.0044), 10);
  expect(layout.line.end.x).toBe(313);
  expect(layout.line.end.y).toBeCloseTo(vertical(0.0131), 10);
  const expected = [
    { name: "riskFree", kind: "riskFree", beta: 0, value: 0.005, radius: 3 },
    { name: "market", kind: "market", beta: 1, value: 0.01, radius: 3 },
    { name: "portfolio", kind: "portfolio", beta: 0.5, value: 0.02, radius: 5 },
    { name: "BBCA", kind: "holding", beta: 1.5, value: -0.01, radius: 3 },
    { name: "TLKM", kind: "otherStock", beta: 1, value: 0, radius: 2.5 },
  ];
  expect(layout.points).toHaveLength(expected.length);
  for (const [index, point] of expected.entries()) {
    const placed = layout.points[index];
    expect(placed).toMatchObject({
      name: point.name,
      kind: point.kind,
      radius: point.radius,
    });
    expect(placed?.x).toBeCloseTo(horizontal(point.beta), 10);
    expect(placed?.y).toBeCloseTo(vertical(point.value), 10);
  }
});

for (const locale of locales) {
  test(`marks each axis at round values with the numbers of the language, and never writes zero with a sign, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const layout = layoutMarketLineChart(line, points, frame);
    expect(layout.betaTicks.map((tick) => tick.text)).toEqual(
      tickTexts[locale].betas,
    );
    expect(layout.returnTicks.map((tick) => tick.text)).toEqual(
      tickTexts[locale].returns,
    );
    for (const [index, value] of [0, 0.5, 1, 1.5].entries()) {
      const tick = layout.betaTicks[index];
      expect(tick?.position).toBeCloseTo(horizontal(value), 10);
      expect(tick?.textAt.x).toBe(tick?.position);
      // The text of a mark of the betas sits 1.25 sizes of text below the plot.
      expect(tick?.textAt.y).toBe(238.5);
    }
    for (const [index, value] of [
      -0.01, -0.005, 0, 0.005, 0.01, 0.015, 0.02,
    ].entries()) {
      const tick = layout.returnTicks[index];
      expect(tick?.position).toBeCloseTo(vertical(value), 10);
      // The text of a mark of the returns ends where the widest text ends, with its middle at the mark.
      expect(tick?.textAt.x).toBe(30);
      expect(tick?.textAt.y).toBeCloseTo(vertical(value) + 3.5, 10);
    }
  });
}

test("puts the title of the returns in the top corner and the title of the betas under the middle of the plot", () => {
  expect(layoutMarketLineChart(line, points, frame).titles).toEqual({
    expectedReturn: { x: 0, y: 10 },
    beta: { x: 174, y: 252 },
  });
});

test("labels each point that has a label beside its mark where the line does not cross it, to the left where the right lacks room, and leaves a point without a label unlabelled", () => {
  // Each label is 0.6 sizes of text wide for each character and 0.75 of that for a subscript, 1.2 sizes high, and 0.3 sizes from a mark, whose radius is 0.3 sizes, or 0.5 for the portfolio. The line crosses the boxes to the right and to the left of the risk-free rate and of the IHSG, so their labels of 10.5 and 6 pixels take the boxes above them, centered on their marks. BBCA at 293.8 has no room for its 24 pixels before the plot ends at 313, so it takes the left.
  const layout = layoutMarketLineChart(line, points, frame);
  const expected = [
    { name: "riskFree", x: horizontal(0) - 5.25, y: vertical(0.005) - 9 },
    { name: "market", x: horizontal(1) - 3, y: vertical(0.01) - 9 },
    { name: "portfolio", x: horizontal(0.5) + 8, y: vertical(0.02) + 3 },
    { name: "BBCA", x: horizontal(1.5) - 30, y: vertical(-0.01) + 3 },
  ];
  expect(layout.labels.map((label) => label.name)).toEqual(
    expected.map((label) => label.name),
  );
  for (const [index, label] of expected.entries()) {
    expect(layout.labels[index]?.x).toBeCloseTo(label.x, 10);
    expect(layout.labels[index]?.y).toBeCloseTo(label.y, 10);
  }
});

test("gives returns without any spread a range, so a flat line still has a height to lie in", () => {
  // The risk-free rate equals the expected return of the market, so every return is 0.5%, which a padding of 0.5% widens to 0% to 1%.
  const flat = {
    riskFreeRate: monthlyReturn(0.005),
    marketExpectedReturn: monthlyReturn(0.005),
  };
  const anchors = points.slice(0, 2).map((point) => ({
    ...point,
    expectedReturn: monthlyReturn(0.005),
  }));
  const layout = layoutMarketLineChart(flat, anchors, frame);
  expect(layout.line.start.y).toBeCloseTo((20 + 226) / 2, 10);
  expect(layout.line.end.y).toBeCloseTo((20 + 226) / 2, 10);
  for (const tick of layout.returnTicks) {
    expect(tick.position).toBeGreaterThanOrEqual(20);
    expect(tick.position).toBeLessThanOrEqual(226);
  }
  expect(layout.returnTicks.length).toBeGreaterThanOrEqual(2);
});

const closeReturnTexts: Record<Locale, readonly string[]> = {
  id: ["0,5%"],
  en: ["0.5%"],
};

for (const locale of locales) {
  test(`writes each mark of the expected returns apart from the others when they spread over less than a hundredth of a percent, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // The expected return of the IHSG lies 0.001% above the risk-free rate of 0.5%, so the marks stand a hundredth of a percent apart at the least, and only the mark at 0.5% lies in the range of the returns.
    const close = {
      riskFreeRate: monthlyReturn(0.005),
      marketExpectedReturn: monthlyReturn(0.00501),
    };
    const anchors = points.slice(0, 2).map((point, index) => ({
      ...point,
      expectedReturn: monthlyReturn(index === 0 ? 0.005 : 0.00501),
    }));
    const layout = layoutMarketLineChart(close, anchors, frame);
    expect(layout.returnTicks.map((tick) => tick.text)).toEqual(
      closeReturnTexts[locale],
    );
  });
}
