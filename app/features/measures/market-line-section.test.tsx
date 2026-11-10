import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { fail } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { LecturerMarketLine, StudentMarketLine } from "./market-line-section";
import { measureFailureText } from "./measure-failure-text";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { measureTableForTest } from "./measure-table-for-test";
import {
  ammnValuationForTest,
  cashValuationForTest,
  databaseWithClosesForTest,
  studentLineForTest,
  valuationForTest,
} from "./measures-for-test.server";
import {
  readPortfolioLine,
  readPortfolioMeasures,
  readStockRows,
} from "./read-measures.server";

// The portfolio of measures-for-test.server.ts holds BBCA, TLKM, and cash, and read-measures.server.test.ts gives the line of its 60 months and the measures of the portfolio and of its stocks, which the decimal module of Python computed. The portfolio of AMMN has a weight of 3,650,000 / 13,650,000 in AMMN, so Python gives it a beta of 0.296989, an expected return of 0.007546, and a distance of 0.004775 from the line of the 38 months of AMMN, whose IHSG has an expected return of -0.002012.

function render(part: ReactNode): string {
  return renderToStaticMarkup(part).replaceAll(/ class="[^"]*"/g, "");
}

function legend(items: readonly [string, string][]): string {
  return `<ul aria-hidden="true">${items.map(([mark, name]) => `<li><svg viewBox="-0.5 -0.5 1 1">${mark}</svg>${name}</li>`).join("")}</ul>`;
}

const marks = {
  portfolio: '<polygon points="0,-0.5 0.5,0 0,0.5 -0.5,0"></polygon>',
  holding: '<circle cx="0" cy="0" r="0.3"></circle>',
  otherStock: '<circle cx="0" cy="0" r="0.25"></circle>',
};

const fall = '<span aria-hidden="true">▼ </span>';
const rise = '<span aria-hidden="true">▲ </span>';
const riskFreeSymbol = "R<sub>f</sub>";

const texts: Record<
  Locale,
  {
    title: string;
    portfolioNotice: string;
    ammnNotice: string;
    latestNotice: string;
    lecturerNotice: string;
    lineNotice: string;
    portfolioName: string;
    holdingsName: string;
    lecturerPortfolioName: string;
    lecturerHoldingsName: string;
    otherStocksName: string;
    formula: string;
    ammnFormula: string;
    pointsLabel: string;
    header: readonly string[];
    riskFreeRow: readonly string[];
    marketRow: readonly string[];
    ammnMarketRow: readonly string[];
    portfolioRow: readonly string[];
    ammnPortfolioRow: readonly string[];
    stockRows: readonly (readonly string[])[];
    ammnRow: readonly string[];
    oneOtherLine: string;
    severalOtherLines: string;
    unmeasured: string;
  }
> = {
  id: {
    title: "Garis pasar sekuritas",
    portfolioNotice:
      "Grafik ini menempatkan portofolio Anda, saham Anda, dan setiap saham lain yang ukurannya memakai bulan-bulan yang sama dengan portofolio Anda terhadap garis pasar sekuritas bulan-bulan tersebut, yang memberikan 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    ammnNotice:
      "Grafik ini menempatkan portofolio Anda, saham Anda, dan setiap saham lain yang ukurannya memakai bulan-bulan yang sama dengan portofolio Anda terhadap garis pasar sekuritas bulan-bulan tersebut, yang memberikan 38 imbal hasil bulanan dari Agustus 2023 sampai September 2026.",
    latestNotice:
      "Portofolio Anda belum memiliki ukuran, sehingga grafik ini menempatkan setiap saham yang ukurannya memakai bulan-bulan lengkap terakhir IHSG terhadap garis pasar sekuritas bulan-bulan tersebut, yang memberikan 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    lecturerNotice:
      "Grafik ini menempatkan portofolio Siti Rahayu dan sahamnya terhadap garis pasar sekuritas dari bulan-bulan ukurannya, yang memberikan 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    lineNotice:
      "Garis ini melewati suku bunga bebas risiko pada beta 0 dan imbal hasil yang diharapkan IHSG pada beta 1, sehingga memberikan imbal hasil yang disyaratkan CAPM untuk setiap beta. Titik di atas garis memiliki imbal hasil yang diharapkan lebih tinggi daripada yang disyaratkan CAPM untuk betanya, dan titik di bawah garis memiliki imbal hasil yang diharapkan lebih rendah.",
    portfolioName: "Portofolio Anda",
    holdingsName: "Saham Anda",
    lecturerPortfolioName: "Portofolio",
    lecturerHoldingsName: "Saham portofolio",
    otherStocksName: "Saham lain",
    formula: `k = ${riskFreeSymbol} + β(E(R<sub>M</sub>) − ${riskFreeSymbol}) = 0,48% + β × (0,05% − 0,48%)`,
    ammnFormula: `k = ${riskFreeSymbol} + β(E(R<sub>M</sub>) − ${riskFreeSymbol}) = 0,48% + β × (-0,20% − 0,48%)`,
    pointsLabel: "Titik-titik grafik",
    header: [
      "Titik",
      "Beta terhadap IHSG",
      "Imbal hasil yang diharapkan",
      "Jarak dari garis pasar sekuritas",
    ],
    riskFreeRow: [
      `Suku bunga bebas risiko (${riskFreeSymbol})`,
      "0,00",
      "0,48%",
      "0,00%",
    ],
    marketRow: ["IHSG (M)", "1,00", "0,05%", "0,00%"],
    ammnMarketRow: ["IHSG (M)", "1,00", "-0,20%", "0,00%"],
    portfolioRow: ["Portofolio Anda (p)", "0,62", "-0,22%", `${fall}-0,43%`],
    ammnPortfolioRow: ["Portofolio Anda (p)", "0,30", "0,75%", `${rise}+0,48%`],
    stockRows: [
      ["BBCA", "0,69", "-0,10%", `${fall}-0,28%`],
      ["TLKM", "0,92", "-0,55%", `${fall}-0,63%`],
    ],
    ammnRow: ["AMMN", "1,11", "2,82%", `${rise}+3,10%`],
    oneOtherLine:
      "AMMN tidak ada di grafik, karena ukurannya memakai bulan-bulan yang berbeda, yang memberikan garis pasar sekuritas yang berbeda. Halamannya menunjukkan jaraknya dari garis itu.",
    severalOtherLines:
      "BBCA dan TLKM tidak ada di grafik, karena ukurannya memakai bulan-bulan yang berbeda, yang memberikan garis pasar sekuritas yang berbeda. Halaman setiap saham itu menunjukkan jaraknya dari garisnya sendiri.",
    unmeasured:
      "Saham yang belum memiliki ukuran tidak ada di grafik, dan tabel ukuran setiap saham di bawah menjelaskan alasannya.",
  },
  en: {
    title: "Security market line",
    portfolioNotice:
      "The chart places your portfolio, your stocks, and every other stock whose measures use the same months as your portfolio against the security market line of those months, which give 60 monthly returns from October 2021 to September 2026.",
    ammnNotice:
      "The chart places your portfolio, your stocks, and every other stock whose measures use the same months as your portfolio against the security market line of those months, which give 38 monthly returns from August 2023 to September 2026.",
    latestNotice:
      "Your portfolio has no measures yet, so the chart places every stock whose measures use the latest complete months of the IHSG against the security market line of those months, which give 60 monthly returns from October 2021 to September 2026.",
    lecturerNotice:
      "The chart places the portfolio of Siti Rahayu and its stocks against the security market line of the months of its measures, which give 60 monthly returns from October 2021 to September 2026.",
    lineNotice:
      "The line runs through the risk-free rate at a beta of 0 and the expected return of the IHSG at a beta of 1, so it gives the return that CAPM requires for each beta. A point above the line has a higher expected return than CAPM requires for its beta, and a point below it has a lower one.",
    portfolioName: "Your portfolio",
    holdingsName: "Your stocks",
    lecturerPortfolioName: "Portfolio",
    lecturerHoldingsName: "Stocks of the portfolio",
    otherStocksName: "Other stocks",
    formula: `k = ${riskFreeSymbol} + β(E(R<sub>M</sub>) − ${riskFreeSymbol}) = 0.48% + β × (0.05% − 0.48%)`,
    ammnFormula: `k = ${riskFreeSymbol} + β(E(R<sub>M</sub>) − ${riskFreeSymbol}) = 0.48% + β × (-0.20% − 0.48%)`,
    pointsLabel: "The points of the chart",
    header: [
      "Point",
      "Beta against the IHSG",
      "Expected return",
      "Distance from the security market line",
    ],
    riskFreeRow: [
      `Risk-free rate (${riskFreeSymbol})`,
      "0.00",
      "0.48%",
      "0.00%",
    ],
    marketRow: ["IHSG (M)", "1.00", "0.05%", "0.00%"],
    ammnMarketRow: ["IHSG (M)", "1.00", "-0.20%", "0.00%"],
    portfolioRow: ["Your portfolio (p)", "0.62", "-0.22%", `${fall}-0.43%`],
    ammnPortfolioRow: ["Your portfolio (p)", "0.30", "0.75%", `${rise}+0.48%`],
    stockRows: [
      ["BBCA", "0.69", "-0.10%", `${fall}-0.28%`],
      ["TLKM", "0.92", "-0.55%", `${fall}-0.63%`],
    ],
    ammnRow: ["AMMN", "1.11", "2.82%", `${rise}+3.10%`],
    oneOtherLine:
      "AMMN is not on the chart, because its measures use different months, which give a different security market line. Its page shows its distance from that line.",
    severalOtherLines:
      "BBCA and TLKM are not on the chart, because their measures use different months, which give different security market lines. The page of each of them shows its distance from its own line.",
    unmeasured:
      "A stock that has no measures yet is not on the chart, and the table of the measures of each stock below says why.",
  },
};

/** The markup of the section from its title to the table of the points, with the chart between the legend and the formula left out, because the tests of its layout check it. */
function sectionWithoutChart(
  parts: {
    notice: string;
    lineNotice: string;
    legend: string;
    formula: string;
    pointsLabel: string;
    table: string;
  },
  title: string,
): string {
  return [
    `<h2>${title}</h2>`,
    `<p>${parts.notice}</p>`,
    `<p>${parts.lineNotice}</p>`,
    parts.legend,
    "CHART",
    `<p>${parts.formula}</p>`,
    `<details><summary>${parts.pointsLabel}</summary>${parts.table}</details>`,
  ].join("");
}

function withoutChart(html: string): string {
  return html.replace(
    /<div aria-hidden="true"><svg viewBox=.*?<\/svg><\/div>/,
    "CHART",
  );
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`draws the line of the months of a portfolio with the portfolio and its stocks, lists every point with its distance from the line, and names the stock on another line and the stocks without measures, for its student, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = render(
      <StudentMarketLine
        marketLine={studentLineForTest(
          databaseWithClosesForTest(),
          valuationForTest(["BBCA", "TLKM"]),
        )}
      />,
    );
    expect(withoutChart(html)).toBe(
      sectionWithoutChart(
        {
          notice: text.portfolioNotice,
          lineNotice: text.lineNotice,
          legend: legend([
            [marks.portfolio, `${text.portfolioName} (p)`],
            [marks.holding, text.holdingsName],
          ]),
          formula: text.formula,
          pointsLabel: text.pointsLabel,
          table: measureTableForTest(text.header, [
            text.riskFreeRow,
            text.marketRow,
            text.portfolioRow,
            ...text.stockRows,
          ]),
        },
        text.title,
      ) +
        `<p>${text.oneOtherLine}</p>` +
        `<p>${text.unmeasured}</p>`,
    );
    // The chart labels the risk-free rate, the IHSG, the portfolio, and each of its stocks.
    expect(html).toContain(
      '<div aria-hidden="true"><svg viewBox="0 0 328 256" font-size="14">',
    );
    for (const label of [
      'R<tspan dy="0.3em" font-size="75%">f</tspan>',
      "M",
      "p",
      "BBCA",
      "TLKM",
    ]) {
      expect(html).toMatch(
        new RegExp(`<text x="[^"]+" y="[^"]+">${label}</text>`),
      );
    }
  });

  test(`draws the line of the fewer months of a portfolio of a recent listing and names the several stocks on other lines, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = render(
      <StudentMarketLine
        marketLine={studentLineForTest(
          databaseWithClosesForTest(),
          ammnValuationForTest(),
        )}
      />,
    );
    expect(withoutChart(html)).toBe(
      sectionWithoutChart(
        {
          notice: text.ammnNotice,
          lineNotice: text.lineNotice,
          legend: legend([
            [marks.portfolio, `${text.portfolioName} (p)`],
            [marks.holding, text.holdingsName],
          ]),
          formula: text.ammnFormula,
          pointsLabel: text.pointsLabel,
          table: measureTableForTest(text.header, [
            text.riskFreeRow,
            text.ammnMarketRow,
            text.ammnPortfolioRow,
            text.ammnRow,
          ]),
        },
        text.title,
      ) +
        `<p>${text.severalOtherLines}</p>` +
        `<p>${text.unmeasured}</p>`,
    );
  });

  test(`draws the line of the latest complete months of the IHSG with every stock on it while the portfolio has no measures, labels the stocks that the portfolio holds, and says nothing about stocks off the chart when every stock lies on it, in ${language}`, () => {
    switchLocaleForTest(locale);
    const database = databaseWithClosesForTest();
    const latest = (
      legendItems: readonly [string, string][],
      rows: readonly (readonly string[])[],
    ): string =>
      sectionWithoutChart(
        {
          notice: text.latestNotice,
          lineNotice: text.lineNotice,
          legend: legend(legendItems),
          formula: text.formula,
          pointsLabel: text.pointsLabel,
          table: measureTableForTest(text.header, [
            text.riskFreeRow,
            text.marketRow,
            ...rows,
          ]),
        },
        text.title,
      );
    const offTheChart = `<p>${text.oneOtherLine}</p><p>${text.unmeasured}</p>`;
    expect(
      withoutChart(
        render(
          <StudentMarketLine
            marketLine={studentLineForTest(database, cashValuationForTest())}
          />,
        ),
      ),
    ).toBe(
      latest([[marks.otherStock, text.otherStocksName]], text.stockRows) +
        offTheChart,
    );
    // The portfolio of BBCA and TLKM lacks a delayed price of TLKM, so it has no measures, but the chart labels the stocks that it holds.
    expect(readPortfolioMeasures(database, valuationForTest(["BBCA"]))).toEqual(
      { kind: "unpriced", codes: ["TLKM"] },
    );
    const held = render(
      <StudentMarketLine
        marketLine={studentLineForTest(database, valuationForTest(["BBCA"]))}
      />,
    );
    expect(withoutChart(held)).toBe(
      latest([[marks.holding, text.holdingsName]], text.stockRows) +
        offTheChart,
    );
    for (const label of ["BBCA", "TLKM"]) {
      expect(held).toMatch(
        new RegExp(`<text x="[^"]+" y="[^"]+">${label}</text>`),
      );
    }
    expect(
      withoutChart(
        render(
          <StudentMarketLine
            marketLine={studentLineForTest(
              database,
              cashValuationForTest(),
              readStockRows(database).filter(
                ({ code }) => code === "BBCA" || code === "TLKM",
              ),
            )}
          />,
        ),
      ),
    ).toBe(latest([[marks.otherStock, text.otherStocksName]], text.stockRows));
  });

  test(`draws the line of the months of the portfolio of a student for the lecturer, with the portfolio and its stocks, in ${language}`, () => {
    switchLocaleForTest(locale);
    const portfolioLine = readPortfolioLine(
      readPortfolioMeasures(
        databaseWithClosesForTest(),
        valuationForTest(["BBCA", "TLKM"]),
      ),
    );
    if (portfolioLine === undefined) {
      throw new Error("The portfolio of BBCA and TLKM has measures.");
    }
    expect(
      withoutChart(
        render(
          <LecturerMarketLine
            studentName="Siti Rahayu"
            portfolioLine={portfolioLine}
          />,
        ),
      ),
    ).toBe(
      sectionWithoutChart(
        {
          notice: text.lecturerNotice,
          lineNotice: text.lineNotice,
          legend: legend([
            [marks.portfolio, `${text.lecturerPortfolioName} (p)`],
            [marks.holding, text.lecturerHoldingsName],
          ]),
          formula: text.formula,
          pointsLabel: text.pointsLabel,
          table: measureTableForTest(text.header, [
            text.riskFreeRow,
            text.marketRow,
            [
              `${text.lecturerPortfolioName} (p)`,
              ...text.portfolioRow.slice(1),
            ],
            ...text.stockRows,
          ]),
        },
        text.title,
      ),
    );
  });

  test(`says why the stored closes give no line, in ${language}`, () => {
    switchLocaleForTest(locale);
    const failure: StoredMeasureFailure = { kind: "noVariation", code: "IHSG" };
    expect(render(<StudentMarketLine marketLine={fail(failure)} />)).toBe(
      `<h2>${text.title}</h2><p>${measureFailureText(failure, { kind: "market" })}</p>`,
    );
  });
}
