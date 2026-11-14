import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import { formatBeta } from "~/formatting";
import { cumulativeReturn } from "~/units/cumulative-return";
import { classSummary } from "./class-summary";

const texts: Record<
  Locale,
  {
    oneAhead: string;
    oneBehind: string;
    paired: string;
    pending: string;
    pendingNotice: string;
    ahead: string;
    behind: string;
    equal: string;
    portfolio: string;
    market: string;
    comparison: readonly [string, string, string, string];
    above: readonly string[];
    calmer: readonly string[];
    medianBeta: string;
    marketBeta: string;
    referenceSentence: string;
  }
> = {
  id: {
    referenceSentence:
      "Median imbal hasil +0,41%, IHSG -1,75%, per periode mahasiswa. 23 dari 32 mahasiswa di atas pasar, dan 28 dari 31 portofolio lebih tenang dari pasar.",
    oneAhead: "Kelas unggul 1,00 poin dari IHSG",
    oneBehind: "Kelas tertinggal 1,00 poin dari IHSG",
    paired: "Kelas unggul 2,00 poin dari IHSG",
    pending: "Kelas menunggu perbandingan dengan IHSG",
    pendingNotice: "Belum ada imbal hasil yang dapat dibandingkan dengan IHSG.",
    ahead: "Kelas unggul 0,01 poin dari IHSG",
    behind: "Kelas tertinggal 0,01 poin dari IHSG",
    equal: "Kelas setara dengan IHSG",
    portfolio: "+10,00%",
    market: "0,00%",
    comparison: [
      "Median imbal hasil ",
      ", IHSG ",
      ", per periode mahasiswa. ",
      ", dan ",
    ],
    above: [
      "Tidak ada mahasiswa di atas pasar",
      "Mahasiswa di atas pasar",
      "Semua 3 mahasiswa di atas pasar",
      "Satu dari 3 mahasiswa di atas pasar",
      "2 dari 3 mahasiswa di atas pasar",
    ],
    calmer: [
      "ukuran risiko belum tersedia",
      "portofolio lebih tenang dari pasar",
      "portofolio tidak lebih tenang dari pasar",
      "tidak ada portofolio lebih tenang dari pasar",
      "semua 3 portofolio lebih tenang dari pasar",
      "satu dari 3 portofolio lebih tenang dari pasar",
      "2 dari 3 portofolio lebih tenang dari pasar",
    ],
    medianBeta: "0,75",
    marketBeta: "1,00",
  },
  en: {
    referenceSentence:
      "Median return +0.41%, IHSG -1.75% over each student’s period. 23 of 32 students are above the market, and 28 of 31 portfolios are calmer than the market.",
    oneAhead: "Class leads IHSG by 1.00 point",
    oneBehind: "Class trails IHSG by 1.00 point",
    paired: "Class leads IHSG by 2.00 points",
    pending: "Class comparison with IHSG is pending",
    pendingNotice: "No return can be compared with IHSG yet.",
    ahead: "Class leads IHSG by 0.01 points",
    behind: "Class trails IHSG by 0.01 points",
    equal: "Class is level with IHSG",
    portfolio: "+10.00%",
    market: "0.00%",
    comparison: [
      "Median return ",
      ", IHSG ",
      " over each student’s period. ",
      ", and ",
    ],
    above: [
      "No student is above the market",
      "The student is above the market",
      "All 3 students are above the market",
      "One of 3 students is above the market",
      "2 of 3 students are above the market",
    ],
    calmer: [
      "risk measures are pending",
      "the portfolio is calmer than the market",
      "the portfolio is not calmer than the market",
      "no portfolio is calmer than the market",
      "all 3 portfolios are calmer than the market",
      "one of 3 portfolios is calmer than the market",
      "2 of 3 portfolios are calmer than the market",
    ],
    medianBeta: "0.75",
    marketBeta: "1.00",
  },
};

for (const locale of locales) {
  test(`writes a short comparison with each student's own period in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // By hand, 23 returns of 0.41% and 9 of -3% have a median of 0.41%, and 28 of the 31 betas are below the market's 1.
    const compared = Array.from({ length: 32 }, (_value, index) => ({
      portfolio: cumulativeReturn(index < 23 ? 0.0041 : -0.03),
      market: cumulativeReturn(-0.0175),
    }));
    const risks = Array.from({ length: 31 }, (_value, index) =>
      beta(index < 28 ? 0.5 : 1),
    );
    expect(classSummary(compared, risks).sentence).toBe(
      texts[locale].referenceSentence,
    );
  });

  test(`shows a pending comparison before any student's period can be compared in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const summary = classSummary([], []);
    expect(summary.headline).toBe(texts[locale].pending);
    expect(summary.sentence).toBe(texts[locale].pendingNotice);
    expect(summary.medianReturn).toBeUndefined();
  });

  test(`chooses the headline after rounding the median difference of each student's own period in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [difference, expected] of [
      [0.01, texts[locale].oneAhead],
      [-0.01, texts[locale].oneBehind],
      [0.009999, texts[locale].oneAhead],
      [-0.009999, texts[locale].oneBehind],
      [0.000051, texts[locale].ahead],
      [0.00005, texts[locale].ahead],
      [-0.000051, texts[locale].behind],
      [-0.00005, texts[locale].behind],
      [0.000049, texts[locale].equal],
      [-0.000049, texts[locale].equal],
      [0, texts[locale].equal],
    ] as const) {
      expect(
        classSummary(
          [
            {
              portfolio: cumulativeReturn(difference),
              market: cumulativeReturn(0),
            },
          ],
          [],
        ).headline,
      ).toBe(expected);
    }
    // By hand, the paired differences are 1%, 2%, and 9%, so their median is 2%. The difference of the two medians is instead 7%.
    const summary = classSummary(
      [
        { portfolio: cumulativeReturn(0.1), market: cumulativeReturn(0.09) },
        { portfolio: cumulativeReturn(0.05), market: cumulativeReturn(0.03) },
        { portfolio: cumulativeReturn(0.12), market: cumulativeReturn(0.03) },
      ],
      [beta(0.5), beta(1)],
    );
    expect(summary.headline).toBe(texts[locale].paired);
    expect(summary.medianBeta).toBe(texts[locale].medianBeta);
  });

  test(`writes the whole sentence for every count and for betas that round to the market beta in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
    const aboveCases = [
      [0],
      [0.1],
      [0.1, 0.1, 0.1],
      [0.1, 0, 0],
      [0.1, 0.1, 0],
    ];
    expect(formatBeta(beta(0.996))).toBe(text.marketBeta);
    const riskCases = [
      { values: [], calmerIndex: 0 },
      { values: [0.5], calmerIndex: 1 },
      { values: [1], calmerIndex: 2 },
      { values: [1, 1.1, 1.2], calmerIndex: 3 },
      { values: [0.5, 0.6, 0.7], calmerIndex: 4 },
      { values: [0.5, 1, 1.1], calmerIndex: 5 },
      { values: [0.5, 0.6, 1], calmerIndex: 6 },
      { values: [0.9949], calmerIndex: 1 },
      { values: [0.995], calmerIndex: 2 },
      { values: [0.996], calmerIndex: 2 },
      { values: [1.0049], calmerIndex: 2 },
      { values: [1.005], calmerIndex: 2 },
      { values: [0.9949, 0.995, 1], calmerIndex: 5 },
      { values: [0.995, 0.996, 1], calmerIndex: 3 },
    ];
    for (const [aboveIndex, returns] of aboveCases.entries()) {
      for (const { values, calmerIndex } of riskCases) {
        const summary = classSummary(
          returns.map((value) => ({
            portfolio: cumulativeReturn(value),
            market: cumulativeReturn(0),
          })),
          values.map(beta),
        );
        const median =
          aboveIndex === 0 || aboveIndex === 3 ? text.market : text.portfolio;
        const [start, versus, period, and] = text.comparison;
        expect(summary.sentence).toBe(
          `${start}${median}${versus}${text.market}${period}${text.above[aboveIndex] ?? ""}${and}${text.calmer[calmerIndex] ?? ""}.`,
        );
      }
    }
  });
}

test("takes the middle return or the mean of the middle pair without changing the input", () => {
  // By hand, sorting 4%, 1%, 3%, 2% gives a middle pair of 2% and 3%, whose mean is 2.5%.
  const values = [0.04, 0.01, 0.03, 0.02].map((value) => ({
    portfolio: cumulativeReturn(value),
    market: cumulativeReturn(0),
  }));
  expect(classSummary(values, []).medianReturn).toBeCloseTo(0.025, 15);
  expect(classSummary(values.slice(0, 3), []).medianReturn).toBe(0.03);
  expect(values.map(({ portfolio }) => portfolio)).toEqual([
    0.04, 0.01, 0.03, 0.02,
  ]);
});
