import { closeToForTest } from "./close-to-for-test";
import { expect, test } from "vitest";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { stockQuote } from "~/features/market-data/stock-quote";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import { shares } from "~/units/shares";
import { rupiah } from "~/units/rupiah";
import { AnalysisAllocation } from "./analysis-allocation";
import { analysisAllocationRows } from "./analysis-allocation-rows";
import { allocationGroups } from "./allocation-groups";
import type { AllocationGroup } from "./allocation-groups";
import { AnalysisCorrelations } from "./analysis-correlations";
import { AnalysisRiskSources } from "./analysis-risk-sources";
import {
  portfolioWithoutVariationForTest,
  portfolioWithNegativeRiskForTest,
} from "./portfolio-against-market-for-test";
import {
  aadiValuationForTest,
  ammnValuationForTest,
  cashValuationForTest,
  databaseWithClosesForTest,
  valuationForTest,
  mixedValuationForTest,
} from "./measures-for-test.server";
import { readPortfolioMeasures } from "./read-measures.server";
import type { PortfolioSummary } from "./measure-summaries";

interface ExtrasText {
  allocation: string;
  allocationConcept: string;
  sector: string;
  stock: string;
  financials: string;
  group: string;
  allocationMeaning: string;
  unpriced: string;
  oneUnpriced: string;
  zero: string;
  correlations: string;
  correlationsMeaning: string;
  pair: string;
  cell: string;
  one: string;
  selfPair: string;
  unavailable: string;
  sources: string;
  oneSource: string;
  riskMeaning: string;
  contribution: string;
  riskRow: string;
  riskTitle: string;
  cash: string;
  wholeCash: string;
  negativeRisk: string;
  overWholeRisk: string;
  values: readonly string[];
  alignedCells: readonly string[];
  alignedRisks: readonly string[];
}
const texts: Record<Locale, ExtrasText> = {
  id: {
    allocation: "Alokasi",
    alignedCells: [
      "BBCA dan TLKM: korelasi 0,51. Lihat perhitungan.",
      "BBCA dan AMMN: korelasi 0,20. Lihat perhitungan.",
      "TLKM dan AMMN: korelasi 0,11. Lihat perhitungan.",
    ],
    alignedRisks: [
      "BBCA 49,9% / 46,9%: kontribusi risiko / bobot. Lihat perhitungan.",
      "TLKM 39,2% / 28,1%: kontribusi risiko / bobot. Lihat perhitungan.",
      "AMMN 10,9% / 6,2%: kontribusi risiko / bobot. Lihat perhitungan.",
    ],
    allocationConcept: "Bobot sektor",
    oneUnpriced:
      "Alokasi belum tersedia karena TLKM belum memiliki harga tertunda. Bobot dihitung setelah pembaruan harga membawa harga saham tersebut.",
    zero: "Nilai portofolio nol, sehingga bobot tidak terdefinisi. Minta pengelola server memeriksa data portofolio.",
    wholeCash: "100,0%",
    negativeRisk: "-33,3%",
    overWholeRisk: "133,3%",
    sector: "Sektor",
    stock: "Saham",
    financials: "Keuangan",
    group: "Kelompokkan alokasi",
    allocationMeaning:
      "Bobot membagi nilai aset atau sektor dengan nilai seluruh portofolio, termasuk kas.",
    unpriced:
      "Alokasi belum tersedia karena BBCA dan TLKM belum memiliki harga tertunda. Bobot dihitung setelah pembaruan harga membawa harga saham tersebut.",
    correlations: "Korelasi antarsaham",
    correlationsMeaning:
      "Korelasi mengukur gerak bersama imbal hasil bulanan dari -1 sampai 1, memakai bulan yang sama untuk semua saham di portofolio.",
    pair: "Korelasi BBCA dan TLKM",
    cell: "BBCA dan TLKM: korelasi 0,50. Lihat perhitungan.",
    one: "Portofolio ini hanya memegang AMMN. Korelasi antarsaham memerlukan saham kedua.",
    selfPair: "Korelasi AMMN dan AMMN",
    unavailable: "Mengapa ukuran belum tersedia?",
    sources: "Sumber risiko portofolio",
    oneSource: "Sumber risiko portofolio",
    riskMeaning:
      "Kontribusi risiko adalah bagian varians portofolio yang ditambahkan suatu saham, dan nilainya dapat negatif bila saham mengimbangi gerak portofolio.",
    contribution: "Kontribusi risiko",
    riskRow:
      "BBCA 57,8% / 50,0%: kontribusi risiko / bobot. Lihat perhitungan.",
    riskTitle: "Kontribusi risiko BBCA",
    cash: "Kas 20,0% tidak menyumbang risiko.",
    values: [
      "50,0%",
      "30,0%",
      "20,0%",
      "57,76%",
      "42,24%",
      "0,00191",
      "0,001653",
      "0,001811",
      "5,23%",
      "6,88%",
    ],
  },
  en: {
    allocation: "Allocation",
    alignedCells: [
      "BBCA and TLKM: correlation 0.51. View calculation.",
      "BBCA and AMMN: correlation 0.20. View calculation.",
      "TLKM and AMMN: correlation 0.11. View calculation.",
    ],
    alignedRisks: [
      "BBCA 49.9% / 46.9%: risk contribution / weight. View calculation.",
      "TLKM 39.2% / 28.1%: risk contribution / weight. View calculation.",
      "AMMN 10.9% / 6.2%: risk contribution / weight. View calculation.",
    ],
    allocationConcept: "Sector weight",
    oneUnpriced:
      "Allocation is unavailable because TLKM has no delayed price. Weights are computed once a price update brings that price.",
    zero: "Portfolio value is zero, so weights are undefined. Ask the server owner to check the portfolio data.",
    wholeCash: "100.0%",
    negativeRisk: "-33.3%",
    overWholeRisk: "133.3%",
    sector: "Sector",
    stock: "Stock",
    financials: "Financials",
    group: "Group allocation",
    allocationMeaning:
      "Weight divides an asset or sector value by the whole portfolio value, including cash.",
    unpriced:
      "Allocation is unavailable because BBCA and TLKM have no delayed prices. Weights are computed once a price update brings those prices.",
    correlations: "Correlations between stocks",
    correlationsMeaning:
      "Correlation measures how monthly returns move together from -1 to 1, using the same months for every stock in the portfolio.",
    pair: "Correlation of BBCA and TLKM",
    cell: "BBCA and TLKM: correlation 0.50. View calculation.",
    one: "This portfolio holds only AMMN. Correlations between stocks need a second stock.",
    selfPair: "Correlation of AMMN and AMMN",
    unavailable: "Why are measures unavailable?",
    sources: "Sources of portfolio risk",
    oneSource: "Source of portfolio risk",
    riskMeaning:
      "Risk contribution is the share of portfolio variance that a stock adds, and it can be negative when the stock offsets portfolio movements.",
    contribution: "Risk contribution",
    riskRow:
      "BBCA 57.8% / 50.0%: risk contribution / weight. View calculation.",
    riskTitle: "Risk contribution of BBCA",
    cash: "Cash of 20.0% contributes no risk.",
    values: [
      "50.0%",
      "30.0%",
      "20.0%",
      "57.76%",
      "42.24%",
      "0.00191",
      "0.001653",
      "0.001811",
      "5.23%",
      "6.88%",
    ],
  },
};

function allocationRowsForTest(
  valuation: Parameters<typeof analysisAllocationRows>[0],
  group: AllocationGroup,
) {
  const allocation = analysisAllocationRows(valuation, group);
  if (allocation.kind !== "valued")
    throw new Error("The fixture needs a positive priced total.");
  return allocation.rows;
}

function measured(
  valuation = valuationForTest(["BBCA", "TLKM"]),
): PortfolioSummary {
  const report = readPortfolioMeasures(databaseWithClosesForTest(), valuation);
  if (report.kind !== "measured" || !report.measures.ok)
    throw new Error("The fixture needs shared monthly returns.");
  return report.measures.value;
}

test("weighs stocks and sectors with cash from independent whole-rupiah arithmetic", () => {
  // Python Decimal divides the recorded values 27,390,000, 16,434,000, and 10,956,000 by 54,780,000.
  const valuation = valuationForTest(["BBCA", "TLKM"]);
  for (const group of allocationGroups) {
    expect(
      allocationRowsForTest(valuation, group).map(({ value, weight }) => ({
        value,
        weight,
      })),
    ).toEqual([
      { value: 27_390_000, weight: 0.5 },
      { value: 16_434_000, weight: 0.3 },
      { value: 10_956_000, weight: 0.2 },
    ]);
  }
  expect(analysisAllocationRows(valuationForTest(["BBCA"]), "sector")).toEqual({
    kind: "unpriced",
    codes: ["TLKM"],
  });
  expect(
    allocationRowsForTest(cashValuationForTest(), "stock").map(
      ({ value, weight }) => ({ value, weight }),
    ),
  ).toEqual([{ value: 100_000_000, weight: 1 }]);
});

test("combines two financial holdings into one sector without removing cash from the denominator", () => {
  const existing = valuationForTest(["BBCA", "TLKM"]);
  const quote = stockQuote("BBRI", [2800, 2810], "2026-10-30T09:14:56.000Z");
  const quotes = new Map(
    existing.holdings.flatMap((holding) =>
      holding.kind === "priced" ? [[holding.code, holding.quote] as const] : [],
    ),
  );
  quotes.set(quote.code, quote);
  const valuation = valuePortfolio(
    {
      cash: existing.cash,
      holdings: [
        ...existing.holdings,
        { code: "BBRI", shares: shares(1_000), cost: rupiah(2_804_200) },
      ],
    },
    existing.startingCash,
    quotes,
  );
  // Python Decimal adds BBCA 27,390,000 and BBRI 2,800,000, then divides the sectors and cash by 57,580,000.
  expect(
    allocationRowsForTest(valuation, "sector").map(
      ({ key, value, weight }) => ({ key, value, weight }),
    ),
  ).toEqual([
    {
      key: "financials",
      value: 30_190_000,
      weight: closeToForTest(0.524314, 6),
    },
    {
      key: "infrastructures",
      value: 16_434_000,
      weight: closeToForTest(0.2854116, 6),
    },
    { key: "cash", value: 10_956_000, weight: closeToForTest(0.1902744, 6) },
  ]);
});

for (const locale of locales) {
  const text = texts[locale];
  test(`uses the shorter shared window when holdings have different listing dates in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // Python Decimal combines the independent covariance matrix in measure-portfolio.test.ts with the quoted holdings in measures-for-test.server.ts.
    const portfolio = measured(mixedValuationForTest());
    expect(portfolio.market.returns).toHaveLength(38);
    expect(portfolio.holdings.map((holding) => holding.returns.length)).toEqual(
      [38, 38, 38],
    );
    const html = renderMarkupForTest(
      <>
        <AnalysisCorrelations portfolio={portfolio} />
        <AnalysisRiskSources
          portfolio={portfolio}
          holdingCount={portfolio.holdings.length}
        />
      </>,
      conceptLessonDataForTest(),
    );
    for (const expected of [...text.alignedCells, ...text.alignedRisks])
      expect(html).toContain(markupTextForTest(expected));
  });
  test(`shows aligned correlations and risk shares with their calculation inputs in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // Python Decimal expectations in read-measures.server.test.ts give correlation 0.5032434834 and risk shares 0.577587 and 0.422413 for these weights.
    const portfolio = measured();
    const html = renderMarkupForTest(
      <>
        <AnalysisAllocation valuation={valuationForTest(["BBCA", "TLKM"])} />
        <AnalysisCorrelations portfolio={portfolio} />
        <AnalysisRiskSources
          portfolio={portfolio}
          holdingCount={portfolio.holdings.length}
        />
      </>,
      conceptLessonDataForTest(),
    );
    for (const expected of [
      text.allocation,
      text.allocationConcept,
      text.sector,
      text.stock,
      text.group,
      text.allocationMeaning,
      text.correlations,
      text.correlationsMeaning,
      text.pair,
      text.cell,
      text.sources,
      text.riskMeaning,
      text.contribution,
      text.riskRow,
      text.riskTitle,
      text.cash,
      ...text.values,
    ])
      expect(html).toContain(markupTextForTest(expected));
    expect(html).toContain('popoverTarget="analysis-pair-BBCA-TLKM"');
    expect(html).toContain('popoverTarget="analysis-risk-BBCA"');
    expect(html).toContain("CORREL");
    expect(html).toContain("SUMPRODUCT");
  });
  test(`keeps allocation without measures and explains one holding, missing prices, and cash alone in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      renderMarkupForTest(
        <AnalysisAllocation valuation={valuationForTest(["BBCA"])} />,
        conceptLessonDataForTest(),
      ),
    ).toContain(text.oneUnpriced);
    const one = measured(ammnValuationForTest());
    expect(one.market.returns).toHaveLength(38);
    expect(
      renderMarkupForTest(
        <AnalysisRiskSources portfolio={one} holdingCount={1} />,
        conceptLessonDataForTest(),
      ),
    ).toContain(text.oneSource);
    const oneMarkup = renderMarkupForTest(
      <AnalysisCorrelations portfolio={one} />,
      conceptLessonDataForTest(),
    );
    expect(oneMarkup.split(markupTextForTest(text.one))).toHaveLength(3);
    expect(oneMarkup).not.toContain(text.selfPair);
    const html = renderMarkupForTest(
      <>
        <AnalysisCorrelations portfolio={undefined} />
        <AnalysisRiskSources portfolio={undefined} holdingCount={1} />
        <AnalysisAllocation valuation={valuationForTest([])} />
      </>,
      conceptLessonDataForTest(),
    );
    for (const expected of [text.unavailable, text.unpriced])
      expect(html).toContain(markupTextForTest(expected));
    const valuation = aadiValuationForTest();
    const report = readPortfolioMeasures(
      databaseWithClosesForTest(),
      valuation,
    );
    expect(report.kind === "measured" && !report.measures.ok).toBe(true);
    expect(
      allocationRowsForTest(valuation, "stock").map(({ key }) => key),
    ).toEqual(["AADI", "cash"]);
    const cashMarkup = renderMarkupForTest(
      <AnalysisAllocation valuation={cashValuationForTest()} />,
      conceptLessonDataForTest(),
    );
    expect(cashMarkup).toContain(text.wholeCash);
    expect(cashMarkup).toContain(markupTextForTest(text.allocationMeaning));
  });
  test(`groups by sector when the address holds an unknown grouping in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const valuation = valuationForTest(["BBCA", "TLKM"]);
    const markupAt = (path: string) =>
      renderInRouterForTest(
        <AnalysisAllocation valuation={valuation} />,
        conceptLessonDataForTest(),
        path,
      );
    const current = (label: string) =>
      new RegExp(`aria-current="true"[^>]*><span>${label}</span>`);
    const stocks = markupAt("/analysis?allocation=stock");
    expect(stocks).toMatch(current(text.stock));
    expect(stocks).not.toContain(`<span>${text.financials}</span>`);
    for (const path of ["/analysis?allocation=sectors", "/analysis"]) {
      const sectors = markupAt(path);
      expect(sectors).toMatch(current(text.sector));
      expect(sectors).toContain(`<span>${text.financials}</span>`);
    }
  });
  test(`explains undefined weights after fully invested holdings are deleted in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const zero = valuePortfolio(
      { cash: rupiah(0), holdings: [] },
      rupiah(100_000_000),
      new Map(),
    );
    expect(zero.total?.value).toBe(0);
    expect(analysisAllocationRows(zero, "stock")).toEqual({
      kind: "zeroValue",
    });
    expect(
      renderMarkupForTest(
        <AnalysisAllocation valuation={zero} />,
        conceptLessonDataForTest(),
      ),
    ).toContain(text.zero);
  });
  test(`explains zero portfolio variance instead of drawing risk shares in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = portfolioWithoutVariationForTest();
    if (report.kind !== "measured" || !report.measures.ok)
      throw new Error("The offsetting stocks need measures.");
    expect(report.measures.value.holdingRisks.ok).toBe(false);
    const html = renderMarkupForTest(
      <AnalysisRiskSources
        portfolio={report.measures.value}
        holdingCount={report.measures.value.holdings.length}
      />,
      conceptLessonDataForTest(),
    );
    expect(html).not.toContain('popoverTarget="analysis-risk-');
    expect(html).toContain(text.sources);
  });
  test(`draws negative contributions to the left of zero and contributions above the whole in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = portfolioWithNegativeRiskForTest();
    if (report.kind !== "measured" || !report.measures.ok)
      throw new Error("The offsetting stocks need measures.");
    const portfolio = report.measures.value;
    // By hand, returns (1, -0.5) and (-0.5, 1) at weights 0.8 and 0.2 give portfolio returns (0.7, -0.2). Dividing weighted covariances by the portfolio variance gives 4/3 and -1/3.
    expect(
      portfolio.holdingRisks.ok &&
        portfolio.holdingRisks.value[1]?.varianceShare,
    ).toBeCloseTo(-1 / 3);
    const html = renderMarkupForTest(
      <>
        <AnalysisRiskSources
          portfolio={portfolio}
          holdingCount={portfolio.holdings.length}
        />
        <AnalysisCorrelations portfolio={portfolio} />
      </>,
      conceptLessonDataForTest(),
    );
    expect(html).toContain(text.negativeRisk);
    expect(html).toContain(text.overWholeRisk);
    expect(html).toContain('x="0%" y="25%" width="20%"');
    expect(html).toContain('x="20%" y="25%" width="80%"');
    expect(html).toContain("var(--color-correlation-negative)");
    expect(html).toContain("+1");
  });
}
