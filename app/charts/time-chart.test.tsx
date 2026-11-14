import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { returnPointsForTest } from "./return-points-for-test";
import { TimeChart } from "./time-chart";

// time-chart-layout.test.ts gives the positions of the returns of returnPointsForTest. A return r lies at (0.0109518658 - r) / 0.0447414855 of the height of the plot, which the chart writes as a percentage with two decimals.
type Point = (typeof returnPointsForTest)[number];

const fall = '<span aria-hidden="true">▼ </span>';
const rise = '<span aria-hidden="true">▲ </span>';

const texts: Record<
  Locale,
  {
    portfolio: string;
    dateLabel: string;
    tableLabel: string;
    latestReturns: readonly [string, string];
    dates: readonly [string, string, string];
    rows: readonly (readonly [string, string, string])[];
  }
> = {
  id: {
    portfolio: "Portofolio Anda",
    dateLabel: "Hari bursa",
    tableLabel: "Imbal hasil pada setiap penutupan",
    latestReturns: [`${fall}-3,07%`, `${fall}-3,02%`],
    dates: ["30 Okt", "2 Nov", "3 Nov"],
    rows: [
      ["30 Okt 2026", "0,00%", "0,00%"],
      ["2 Nov 2026", `${fall}-0,15%`, `${rise}+0,79%`],
      ["3 Nov 2026", `${fall}-3,07%`, `${fall}-3,02%`],
    ],
  },
  en: {
    portfolio: "Your portfolio",
    dateLabel: "Trading day",
    tableLabel: "The return at each close",
    latestReturns: [`${fall}-3.07%`, `${fall}-3.02%`],
    dates: ["Oct 30", "Nov 2", "Nov 3"],
    rows: [
      ["Oct 30, 2026", "0.00%", "0.00%"],
      ["Nov 2, 2026", `${fall}-0.15%`, `${rise}+0.79%`],
      ["Nov 3, 2026", `${fall}-3.07%`, `${fall}-3.02%`],
    ],
  },
};

function render(chartPoints: readonly Point[], locale: Locale): string {
  return renderToStaticMarkup(
    <TimeChart
      points={chartPoints}
      lines={[
        {
          name: texts[locale].portfolio,
          kind: "own",
          valueOf: (point) => point.portfolio,
        },
        { name: "IHSG", kind: "reference", valueOf: (point) => point.market },
      ]}
      labelledBy="return-heading"
      dateLabel={texts[locale].dateLabel}
      tableLabel={texts[locale].tableLabel}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

function line(path: string, dot: string): string {
  return `<g><svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" overflow="visible"><path d="${path}" vector-effect="non-scaling-stroke"></path></svg><circle cx="100%" cy="${dot}" r="0.4em"></circle></g>`;
}

for (const locale of locales) {
  const text = texts[locale];

  test(`draws the chart on the server with its marks, a line of each series under the line of the reader, a dot on the latest return of each line, a legend that names each line with its latest return, and a table of every point, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = render(returnPointsForTest, locale);
    for (const part of [
      `<ul><li><span aria-hidden="true"></span>${text.portfolio} ${text.latestReturns[0]}</li><li><span aria-hidden="true"></span>IHSG ${text.latestReturns[1]}</li></ul>`,
      // The texts of the marks of returns are at most 3 characters long.
      '<div style="padding-block:0.5em 2em;padding-inline:calc(3ch + 0.75em) 0.4em"><div><svg aria-hidden="true">',
      '<line x1="0" x2="100%" y1="69.18%" y2="69.18%"></line><text x="0" y="69.18%" dx="-0.75em" dy="0.35em" text-anchor="end">-2%</text>',
      '<line x1="0" x2="100%" y1="24.48%" y2="24.48%"></line><text x="0" y="24.48%" dx="-0.75em" dy="0.35em" text-anchor="end">0%</text>',
      `<text x="0%" y="100%" dy="1.5em" text-anchor="start">${text.dates[0]}</text><text x="50%" y="100%" dy="1.5em" text-anchor="middle">${text.dates[1]}</text><text x="100%" y="100%" dy="1.5em" text-anchor="end">${text.dates[2]}</text>`,
      line("M0 24.48L50 6.9L100 91.99", "91.99%") +
        line("M0 24.48L50 27.82L100 93.1", "93.1%"),
      `<details><summary>${text.tableLabel}</summary><table><thead><tr><th scope="col">${text.dateLabel}</th><th scope="col">${text.portfolio}</th><th scope="col">IHSG</th></tr></thead><tbody>${text.rows
        .map(
          ([date, portfolio, market]) =>
            `<tr><th scope="row">${date}</th><td>${portfolio}</td><td>${market}</td></tr>`,
        )
        .join("")}</tbody></table></details>`,
    ]) {
      expect(html).toContain(part);
    }
    // The plot becomes a slider only once JavaScript runs in the browser, so before then no control does nothing.
    expect(html).not.toContain("slider");
    expect(html).not.toContain("tabindex");
  });
}

test("draws nothing without a point", () => {
  switchLocaleForTest("id");
  expect(render([], "id")).toBe("");
});
