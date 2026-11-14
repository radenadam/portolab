import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { formatSignedPercent } from "~/formatting";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { portfolioWeight } from "~/units/portfolio-weight";
import { crowdedMapForTest } from "./crowded-map-for-test";
import { RiskMap } from "./risk-map";
import { RiskMapLegend } from "./risk-map-legend";
import type { MapPoint, MarkedPoint } from "./layout-risk-map";

// The points of layout-risk-map.test.ts, which places a beta b at b / 2.16 across the plot and a return r at (3.32% - r) / 4.64% down it. The chart writes each position as a percentage with two decimals.
function mapPoint(
  key: string,
  values: { beta: number; return: number },
): MapPoint<Beta, MonthlyReturn> {
  return {
    key,
    name: key,
    across: beta(values.beta),
    up: monthlyReturn(values.return),
    values: [
      { name: "Beta", value: String(values.beta) },
      { name: "Alpha", value: formatSignedPercent(values.return) },
    ],
  };
}

const points: MarkedPoint<Beta, MonthlyReturn>[] = [
  {
    ...mapPoint("Portofolio Anda", { beta: 0.5, return: 0.02 }),
    mark: { kind: "own" },
  },
  {
    ...mapPoint("BBCA", { beta: 1.5, return: -0.01 }),
    mark: { kind: "held", weight: portfolioWeight(0.25) },
  },
  {
    ...mapPoint("TLKM", { beta: 2, return: 0.03 }),
    mark: { kind: "other" },
  },
];

const tickTexts: Record<Locale, { across: readonly string[] }> = {
  id: { across: ["0,0", "0,5", "1,0", "1,5", "2,0"] },
  en: { across: ["0.0", "0.5", "1.0", "1.5", "2.0"] },
};

function render(mapPoints = points): string {
  return renderToStaticMarkup(
    <RiskMap
      market={mapPoint("IHSG", { beta: 1, return: 0.01 })}
      points={mapPoints}
      across={{ style: "decimal", toValue: beta, title: "Beta" }}
      up={{ style: "percent", toValue: monthlyReturn }}
      line={{
        name: "SML",
        start: { across: beta(0), up: monthlyReturn(0.005) },
      }}
      levelLabel="IHSG 1%"
      labelledBy="map-heading"
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

for (const locale of locales) {
  test(`keeps the portfolio and holding names when a caller hides other point labels in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = render(points.map((point) => ({ ...point, label: "" })));
    expect(html).toContain(">Portofolio Anda</text>");
    expect(html).toContain(">BBCA</text>");
    expect(html).not.toContain(">TLKM</text>");
  });
}

/** The text of a label at the position of its point, with any place beside it. */
function label(text: string, at: { x: string; y: string }): RegExp {
  return new RegExp(
    `<text x="${at.x}" y="${at.y}" dx="-?[0-9.]+em" dy="-?[0-9.]+em" text-anchor="(start|middle|end)">${text}</text>`,
  );
}

function crowdedPoints(
  portfolioName: string,
): MarkedPoint<Beta, MonthlyReturn>[] {
  const { holdings, others } = crowdedMapForTest();
  const stocks: MarkedPoint<Beta, MonthlyReturn>[] = [];
  for (const point of [...holdings, ...others]) {
    const holdingIndex = holdings.indexOf(point);
    stocks.push({
      ...mapPoint(point.key, {
        beta: point.position.x * 2,
        return: (point.position.y - 0.5) * 0.04,
      }),
      mark:
        holdingIndex === -1
          ? { kind: "other" }
          : {
              kind: "held",
              weight: portfolioWeight((holdings.length - holdingIndex) * 0.05),
            },
    });
  }
  return [
    ...stocks,
    {
      ...mapPoint(portfolioName, { beta: 1, return: 0 }),
      mark: { kind: "own" },
    },
  ];
}

const portfolioNames: Record<Locale, string> = {
  id: "Portofolio Anda",
  en: "Your portfolio",
};

for (const locale of locales) {
  test(`keeps the portfolio and every holding named on a crowded phone map before JavaScript loads, and leaves out other stock names first, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const crowded = crowdedPoints(portfolioNames[locale]);
    const held = crowded.filter(({ mark }) => mark.kind === "held");
    const other = crowded.filter(({ mark }) => mark.kind === "other");
    const textsOf = (html: string): string[] =>
      [...html.matchAll(/<text [^>]*>([^<]*)<\/text>/g)].map(
        ([, text]) => text ?? "",
      );
    expect(held).toHaveLength(5);
    expect(other).toHaveLength(40);
    const html = render(crowded);
    const names = textsOf(html);
    expect(other.some(({ name }) => !names.includes(name))).toBe(true);
    expect(names).toContain(portfolioNames[locale]);
    for (const { name } of held) {
      expect(names).toContain(name);
    }
    const reversed = render(crowded.toReversed());
    for (const name of [
      portfolioNames[locale],
      ...held.map(({ name }) => name),
    ]) {
      const labelOf = (markup: string): string | undefined =>
        new RegExp(`<text [^>]*>${name}</text>`).exec(markup)?.[0];
      expect(labelOf(reversed)).toBe(labelOf(html));
    }
    const withoutHoldings = textsOf(
      render(
        crowded.map((point) =>
          point.mark.kind === "held"
            ? { ...point, mark: { kind: "other" } }
            : point,
        ),
      ),
    );
    expect(held.some(({ name }) => !withoutHoldings.includes(name))).toBe(true);
    expect(
      other.some(
        ({ name }) => withoutHoldings.includes(name) && !names.includes(name),
      ),
    ).toBe(true);
  });

  test(`draws the map on the server with its axes, the lines of the IHSG and the line through it, a mark of each kind of point under the mark of the reader, and the name of each point beside it, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = render();
    for (const part of [
      // The texts of the marks of returns, 0% and 2%, are at most 2 characters long.
      '<div style="padding-block:0.5em 3.5em;padding-inline:calc(2ch + 0.75em + 1.5 * var(--text-small)) 0.5em"><div><svg aria-hidden="true">',
      '<line x1="0" x2="100%" y1="71.55%" y2="71.55%"></line><text x="0" y="71.55%" dx="-0.75em" dy="0.35em" text-anchor="end" style="translate:calc(-1.5 * var(--text-small))">0%</text>',
      '<line x1="0" x2="100%" y1="28.45%" y2="28.45%"></line><text x="0" y="28.45%" dx="-0.75em" dy="0.35em" text-anchor="end" style="translate:calc(-1.5 * var(--text-small))">2%</text>',
      ...tickTexts[locale].across.map(
        (text, index) =>
          `<text x="${["0%", "23.15%", "46.3%", "69.44%", "92.59%"][index] ?? ""}" y="100%" dy="1.5em" text-anchor="middle">${text}</text>`,
      ),
      // The strong line through the risk of the IHSG, the name of the axis of risk, the dashed line at the return of the IHSG, and the line from its start to the right edge.
      '<line x1="46.3%" x2="46.3%" y1="0" y2="100%"></line><text x="100%" y="100%" dy="3em" text-anchor="end">Beta</text>',
      '<line x1="0" x2="100%" y1="50%" y2="50%"></line><line x1="0%" y1="60.78%" x2="100%" y2="37.5%"></line>',
      // The hollow dot of a stock that the portfolio does not hold, the dot of a stock that it holds with a weight of 25%, the diamond of the IHSG, and the ringed dot of the reader, in that order.
      '<circle cx="92.59%" cy="6.9%" r="0.42em"></circle>' +
        '<circle cx="69.44%" cy="93.1%" r="0.88em"></circle>' +
        '<svg x="46.3%" y="50%" overflow="visible"><svg x="-0.58em" y="-0.58em" width="1.16em" height="1.16em" viewBox="-1 -1 2 2" overflow="visible"><path d="M0 -1L1 0L0 1L-1 0Z" vector-effect="non-scaling-stroke"></path></svg></svg>' +
        '<g><circle cx="23.15%" cy="28.45%" r="1.04em"></circle><circle cx="23.15%" cy="28.45%" r="0.67em"></circle></g>',
    ]) {
      expect(html).toContain(part);
    }
    for (const [name, at] of [
      ["Portofolio Anda", { x: "23.15%", y: "28.45%" }],
      ["BBCA", { x: "69.44%", y: "93.1%" }],
      ["TLKM", { x: "92.59%", y: "6.9%" }],
      ["IHSG", { x: "46.3%", y: "50%" }],
      ["IHSG 1%", { x: "0%", y: "50%" }],
      ["SML", { x: "100%", y: "37.5%" }],
    ] as const) {
      expect(html).toMatch(label(name, at));
    }
    // The plot becomes a slider only once JavaScript runs in the browser, so before then no control does nothing.
    expect(html).not.toContain("slider");
    expect(html).not.toContain("tabindex");
  });
}

test("names each kind of point and the line in a legend beside a sample of its mark, which screen readers skip", () => {
  expect(
    renderToStaticMarkup(
      <RiskMapLegend
        items={[
          { kind: "own", name: "Portofolio Anda" },
          { kind: "held", name: "Saham Anda" },
          { kind: "other", name: "Saham lain" },
          { kind: "market", name: "IHSG" },
          { kind: "line", name: "SML" },
        ]}
      />,
    ).replaceAll(/ class="[^"]*"/g, ""),
  ).toBe(
    '<ul aria-hidden="true"><li><span></span>Portofolio Anda</li><li><span></span>Saham Anda</li><li><span></span>Saham lain</li><li><span></span>IHSG</li><li><span></span>SML</li></ul>',
  );
});
