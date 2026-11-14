import { expect, test } from "vitest";
import { conceptCardBodiesForTest } from "~/concept-card-markup-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { MarketSection } from "./market-section";
import { MeasureList } from "./measure-list";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import {
  negativeTreynorTextForTest,
  portfolioAgainstMarketForTest,
  portfolioWithoutVariationForTest,
} from "./portfolio-against-market-for-test";
import { portfolioMeasureRows } from "./portfolio-measure-rows";
import {
  readPortfolioMeasures,
  readStockMeasures,
} from "./read-measures.server";
import { StockMeasuresView } from "./stock-measures-view";

const reader = { kind: "owner", classId: 7 as ClassId } as const;

interface CardText {
  title: string;
  meaning: string;
  value: string;
  session: number;
  monthly: boolean;
}

const texts: Record<
  Locale,
  {
    example: string;
    calculation: string;
    monthly: string;
    help: (concept: string) => string;
    lesson: (session: number) => string;
    cards: readonly CardText[];
    stockValues: readonly (readonly [string, string])[];
    negativeBeta: string;
    noSharpe: string;
  }
> = {
  id: {
    example: "Angka pada halaman ini",
    calculation: "Lihat perhitungan",
    monthly: "Nilai ini per bulan.",
    help: (concept) => `Apa itu ${concept}?`,
    lesson: (session) =>
      `Pelajari lebih lanjut di sesi ${String(session)}. Pelajaran belum tersedia di Portolab.`,
    cards: [
      {
        title: "Imbal hasil yang diharapkan",
        meaning:
          "Portolab memakai rata-rata imbal hasil bulanan yang lalu sebagai perkiraan imbal hasil ke depan.",
        value: "-0,22%",
        session: 10,
        monthly: true,
      },
      {
        title: "Simpangan baku",
        meaning:
          "Simpangan baku mengukur seberapa jauh imbal hasil bulanan menyimpang dari rata-ratanya.",
        value: "4,07%",
        session: 10,
        monthly: true,
      },
      {
        title: "Beta terhadap IHSG",
        meaning:
          "Beta mengukur seberapa kuat imbal hasil bergerak mengikuti IHSG.",
        value: "0,62",
        session: 9,
        monthly: false,
      },
      {
        title: "Rasio Sharpe",
        meaning:
          "Rasio Sharpe membagi imbal hasil di atas tingkat bebas risiko dengan simpangan baku portofolio.",
        value: "-0,17",
        session: 10,
        monthly: false,
      },
      {
        title: "Rasio Treynor",
        meaning:
          "Rasio Treynor membagi imbal hasil di atas tingkat bebas risiko dengan beta portofolio.",
        value: "-1,12%",
        session: 10,
        monthly: true,
      },
      {
        title: "Alpha Jensen",
        meaning:
          "Alpha Jensen adalah selisih imbal hasil yang diharapkan dengan imbal hasil yang disyaratkan CAPM untuk beta yang sama.",
        value: "-0,43%",
        session: 9,
        monthly: true,
      },
      {
        title: "Imbal hasil yang diharapkan IHSG",
        meaning:
          "IHSG mengukur pergerakan saham di BEI, dan Portolab memakainya sebagai portofolio pasar.",
        value: "0,05%",
        session: 4,
        monthly: true,
      },
      {
        title: "Suku bunga bebas risiko",
        meaning:
          "Portolab memakai BI-Rate sebagai tingkat bebas risiko dan mengubahnya menjadi tingkat per bulan.",
        value: "0,48%",
        session: 9,
        monthly: true,
      },
    ],
    stockValues: [
      ["Imbal hasil yang diharapkan", "-0,10%"],
      ["Simpangan baku", "5,23%"],
      ["Beta terhadap IHSG", "0,69"],
      ["Alpha Jensen", "-0,28%"],
    ],
    negativeBeta: "(-0,52)",
    noSharpe:
      "Imbal hasil portofolio sama di setiap bulan, sehingga varians dan simpangan bakunya nol, dan ukuran yang membagi dengan keduanya tidak memiliki nilai. Portolab menghitung ukuran seperti itu setelah suatu order tereksekusi atau pembaruan riwayat harga memberi portofolio imbal hasil yang berbeda dari bulan ke bulan.",
  },
  en: {
    example: "Value on this page",
    calculation: "View calculation",
    monthly: "This value is per month.",
    help: (concept) => `What is ${concept}?`,
    lesson: (session) =>
      `Learn more in session ${String(session)}. The lesson is not available in Portolab yet.`,
    cards: [
      {
        title: "Expected return",
        meaning:
          "Portolab uses the average past monthly return as an estimate of future returns.",
        value: "-0.22%",
        session: 10,
        monthly: true,
      },
      {
        title: "Standard deviation",
        meaning:
          "Standard deviation measures how far monthly returns vary from their average.",
        value: "4.07%",
        session: 10,
        monthly: true,
      },
      {
        title: "Beta against the IHSG",
        meaning: "Beta measures how strongly returns move with the IHSG.",
        value: "0.62",
        session: 9,
        monthly: false,
      },
      {
        title: "Sharpe ratio",
        meaning:
          "The Sharpe ratio divides the return above the risk-free rate by the standard deviation of the portfolio.",
        value: "-0.17",
        session: 10,
        monthly: false,
      },
      {
        title: "Treynor ratio",
        meaning:
          "The Treynor ratio divides the return above the risk-free rate by the beta of the portfolio.",
        value: "-1.12%",
        session: 10,
        monthly: true,
      },
      {
        title: "Jensen's alpha",
        meaning:
          "Jensen's alpha is the difference between the expected return and the return that CAPM requires for the same beta.",
        value: "-0.43%",
        session: 9,
        monthly: true,
      },
      {
        title: "Expected return of the IHSG",
        meaning:
          "The IHSG measures stock movements on IDX, and Portolab uses it as the market portfolio.",
        value: "0.05%",
        session: 4,
        monthly: true,
      },
      {
        title: "Risk-free rate",
        meaning:
          "Portolab uses the BI-Rate as the risk-free rate and converts it to a monthly rate.",
        value: "0.48%",
        session: 9,
        monthly: true,
      },
    ],
    stockValues: [
      ["Expected return", "-0.10%"],
      ["Standard deviation", "5.23%"],
      ["Beta against the IHSG", "0.69"],
      ["Jensen's alpha", "-0.28%"],
    ],
    negativeBeta: "(-0.52)",
    noSharpe:
      "The returns of the portfolio are the same in every month, so its variance and its standard deviation are zero, and a measure that divides by them has no value. Portolab computes such a measure once an order fills or an update of the price history gives the portfolio returns that differ from month to month.",
  },
};

function cardBody(cards: readonly string[], title: string): string | undefined {
  return cards.find((body) =>
    body.startsWith(`<p>${markupTextForTest(title)}</p>`),
  );
}

for (const locale of locales) {
  const text = texts[locale];

  test(`opens every measure concept with its meaning, actual value, calculation, and lesson notice in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = readPortfolioMeasures(
      databaseWithClosesForTest(),
      valuationForTest(["BBCA", "TLKM"]),
    );
    if (report.kind !== "measured") {
      throw new Error("The priced portfolio has measures.");
    }
    const portfolio = successValueForTest(
      report.measures,
      "The portfolio shares 60 months with the IHSG",
    );
    const html = renderMarkupForTest(
      <>
        <MeasureList rows={portfolioMeasureRows(portfolio, reader)} />
        <MarketSection market={portfolio.market} />
      </>,
      conceptLessonDataForTest(),
    );
    const cards = conceptCardBodiesForTest(html);
    expect(cards).toHaveLength(9);
    for (const card of text.cards) {
      const contents = cardBody(cards, card.title);
      expect(contents).toBeDefined();
      expect(contents).toContain(`<p>${markupTextForTest(card.meaning)}</p>`);
      expect(contents).toContain(`<p>${text.example}</p>`);
      expect(contents).toContain(card.value);
      expect(contents?.includes(`<p>${text.monthly}</p>`)).toBe(card.monthly);
      expect(contents).toContain(
        `<details><summary>${text.calculation}</summary>`,
      );
      expect(contents).toContain(`<p>${text.lesson(card.session)}</p>`);
      expect(html).toContain(
        `aria-label="${markupTextForTest(text.help(card.title))}"`,
      );
    }
    expect(html).toContain(`<p>${text.monthly}</p>`);
    expect(html).toContain("SUMPRODUCT");
    expect(html).toContain("BBCA");
    expect(html).toContain("TLKM");
    expect(html).toContain('popover="auto"');
    expect(html).not.toContain("/learn/");
  });

  test(`uses the stock's values rather than the portfolio's values in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = renderMarkupForTest(
      <StockMeasuresView
        code="BBCA"
        measures={readStockMeasures(databaseWithClosesForTest(), "BBCA")}
      />,
      conceptLessonDataForTest(),
    );
    const cards = conceptCardBodiesForTest(html);
    for (const [title, value] of text.stockValues) {
      expect(cardBody(cards, title)).toContain(value);
    }
    expect(html).toContain("SLOPE");
    expect(html).toContain("AVERAGE");
    expect(html).toContain("STDEV.S");
  });

  test(`explains the missing Treynor ratio inside its card when beta is negative in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = portfolioAgainstMarketForTest();
    if (report.kind !== "measured") {
      throw new Error("The portfolio has measures.");
    }
    const portfolio = successValueForTest(
      report.measures,
      "The portfolio has returns",
    );
    expect(portfolio.beta).toBeLessThan(0);
    expect(portfolio.treynorRatio.ok).toBe(false);
    const row = portfolioMeasureRows(portfolio, reader).find(
      (candidate) => candidate.concept === "treynor",
    );
    if (row === undefined) {
      throw new Error("The portfolio has a Treynor row.");
    }
    const html = renderMarkupForTest(
      <MeasureList rows={[row]} />,
      conceptLessonDataForTest(),
    );
    const card = conceptCardBodiesForTest(html)[0];
    expect(card).toContain(
      `<p>${markupTextForTest(negativeTreynorTextForTest[locale])}</p>`,
    );
    expect(html).toContain(text.negativeBeta);
  });
  test(`explains a missing Sharpe ratio for stocks whose combined returns do not vary in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = portfolioWithoutVariationForTest();
    if (report.kind !== "measured") {
      throw new Error("The offsetting stocks have measures.");
    }
    const portfolio = successValueForTest(
      report.measures,
      "The stocks share monthly returns",
    );
    expect(portfolio.variance).toBe(0);
    expect(portfolio.sharpeRatio.ok).toBe(false);
    const rows = portfolioMeasureRows(portfolio, reader).filter(
      (row) => row.concept === "sharpe",
    );
    expect(rows).toHaveLength(1);
    const card = conceptCardBodiesForTest(
      renderMarkupForTest(
        <MeasureList rows={rows} />,
        conceptLessonDataForTest(),
      ),
    )[0];
    expect(card).toContain(`<p>${text.noSharpe}</p>`);
  });
}
