import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import {
  negativeTreynorTextForTest,
  portfolioAgainstMarketForTest,
} from "./portfolio-against-market-for-test";
import { withoutConceptCardsForTest } from "~/concept-card-markup-for-test";
import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { measureDefinitionsForTest } from "./measure-definitions-for-test";
import { measureFailureText } from "./measure-failure-text";
import { measureTableForTest } from "./measure-table-for-test";
import {
  aadiValuationForTest,
  cashValuationForTest,
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { PortfolioMeasuresView } from "./portfolio-measures-view";
import { readPortfolioMeasures } from "./read-measures.server";
import type { PortfolioMeasuresReport } from "./read-measures.server";

// The portfolio of measures-for-test.server.ts holds BBCA, TLKM, and cash at weights of 0.5, 0.3, and 0.2. read-measures.server.test.ts explains its measures, which come from the values that the decimal module of Python computed for BBCA and TLKM: an expected return of -0.002159, a variance of 0.001653, a standard deviation of 0.040657, a beta of 0.620693, a required return of 0.002101, a Jensen's alpha of -0.004260, a Sharpe ratio of -0.170950, a Treynor ratio of -0.011198, covariances of BBCA and TLKM with the portfolio of 0.0019095 and 0.0023275, shares of the variance of 0.577587 and 0.422413, and correlations with the portfolio of 0.898491 and 0.831512. Intl puts a no-break space after the currency, which the texts write as \u00a0.
const yahooFinance: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};

// The student who owns the portfolio reads about "your" portfolio and opens the page of each of its stocks, and the lecturer of the class reads about the portfolio of the student by name.
const readers: Record<PortfolioReader["kind"], PortfolioReader> = {
  owner: { kind: "owner", classId: 7 as ClassId },
  lecturer: { kind: "lecturer", studentName: "Siti Rahayu" },
};

function renderView(
  report: PortfolioMeasuresReport,
  reader: PortfolioReader,
  quoteFailure: string | undefined,
): string {
  return withoutConceptCardsForTest(
    renderInRouterForTest(
      <PortfolioMeasuresView
        reader={reader}
        report={report}
        quoteFailure={quoteFailure}
        source={yahooFinance}
      />,
      conceptLessonDataForTest(),
    ),
  ).replaceAll(/ class="[^"]*"/g, "");
}

/** The sentences about a partial update of prices at 16:15 WIB on Friday 30 October 2026 that did not update TLKM, seen half a minute later. */
function quoteFailureForTest(): string | undefined {
  return holdingQuoteFailureText(
    [
      {
        valuation: valuationForTest(["BBCA", "TLKM"]),
        quoteAttempt: {
          attemptedAt: new Date("2026-10-30T09:15:00Z"),
          succeeded: true,
          consecutiveFailures: 0,
          failedCodes: ["TLKM"],
        },
      },
    ],
    { now: new Date("2026-10-30T09:15:30Z"), delayMinutes: 10 },
  );
}

// The name of a stock in the table of the stocks of the portfolio, which links to the page of the stock only for its owner.
const stockNames: Record<PortfolioReader["kind"], (code: string) => string> = {
  owner: (code) =>
    `<a href="/classes/7/measures/${code}" data-discover="true">${code}</a>`,
  lecturer: (code) => code,
};

const fall = '<span aria-hidden="true">▼ </span>';

const texts: Record<
  Locale,
  {
    months: string;
    rows: readonly (readonly [string, string, string])[];
    below: string;
    weightsTable: string;
    holdingsHeader: readonly string[];
    holdingsRows: readonly (readonly [string, string, string, string])[];
    holdingFormulas: string;
    pairsNotice: string;
    pairsTable: string;
    pairFormulas: string;
    risksNotice: string;
    risksTable: string;
    riskFormulas: string;
    summaries: readonly string[];
  }
> = {
  id: {
    months:
      "Ukuran di bawah memakai 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    rows: [
      [
        "Imbal hasil yang diharapkan",
        "-0,22%",
        "E(R<sub>p</sub>) = Σ w<sub>i</sub> E(R<sub>i</sub>) (SUMPRODUCT)",
      ],
      [
        "Varians",
        "0,001653",
        "σ²<sub>p</sub> = Σ<sub>i</sub> Σ<sub>j</sub> w<sub>i</sub> w<sub>j</sub> σ<sub>ij</sub> (MMULT)",
      ],
      [
        "Simpangan baku",
        "4,07%",
        "σ<sub>p</sub> = √σ²<sub>p</sub> = √0,001653",
      ],
      [
        "Beta terhadap IHSG",
        "0,62",
        "β<sub>p</sub> = Σ w<sub>i</sub> β<sub>i</sub> (SUMPRODUCT)",
      ],
      [
        "Rasio Sharpe",
        "-0,17",
        "S<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / σ<sub>p</sub> = (-0,22% − 0,48%) / 4,07%",
      ],
      [
        "Rasio Treynor",
        "-1,12%",
        "T<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / β<sub>p</sub> = (-0,22% − 0,48%) / 0,62",
      ],
      [
        "Imbal hasil yang disyaratkan CAPM",
        "0,21%",
        "k<sub>p</sub> = R<sub>f</sub> + β<sub>p</sub>(E(R<sub>M</sub>) − R<sub>f</sub>) = 0,48% + 0,62 × (0,05% − 0,48%)",
      ],
      [
        "Alpha Jensen",
        `${fall}-0,43%`,
        "α<sub>p</sub> = E(R<sub>p</sub>) − k<sub>p</sub> = -0,22% − 0,21%",
      ],
    ],
    below:
      "Imbal hasil yang diharapkan berada di bawah garis pasar sekuritas, sehingga lebih rendah daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    weightsTable: measureTableForTest(
      ["Saham", "Nilai", "Bobot"],
      [
        ["BBCA", "Rp\u00a027.390.000", "50,00%"],
        ["TLKM", "Rp\u00a016.434.000", "30,00%"],
        ["Kas", "Rp\u00a010.956.000", "20,00%"],
        ["Total", "Rp\u00a054.780.000", "100,00%"],
      ],
    ),
    holdingsHeader: [
      "Saham",
      "Bobot",
      "Imbal hasil yang diharapkan",
      "Beta terhadap IHSG",
    ],
    holdingsRows: [
      ["BBCA", "50,00%", "-0,10%", "0,69"],
      ["TLKM", "30,00%", "-0,55%", "0,92"],
    ],
    holdingFormulas:
      "<p>E(R<sub>i</sub>) = ΣR<sub>i</sub> / n, n = 60 (AVERAGE)</p><p>β<sub>i</sub> = σ<sub>iM</sub> / σ²<sub>M</sub> (SLOPE)</p>",
    pairsNotice:
      "Kovarians suatu saham dengan dirinya sendiri adalah variansnya, dan korelasi suatu saham dengan dirinya sendiri sempurna.",
    pairsTable: measureTableForTest(
      ["Saham", "Kovarians", "Korelasi"],
      [
        ["BBCA", "0,002732", "1,00"],
        ["BBCA dan TLKM", "0,001811", "0,50"],
        ["TLKM", "0,00474", "1,00"],
      ],
    ),
    pairFormulas:
      "<p>σ<sub>ij</sub> = Σ(R<sub>i</sub> − E(R<sub>i</sub>))(R<sub>j</sub> − E(R<sub>j</sub>)) / (n − 1) (COVARIANCE.S)</p><p>ρ<sub>ij</sub> = σ<sub>ij</sub> / (σ<sub>i</sub> σ<sub>j</sub>) (CORREL)</p>",
    risksNotice:
      "Bagian varians suatu saham adalah bobotnya dikali kovariansnya dengan portofolio, dibagi varians portofolio, sehingga bagian semua saham bersama-sama membentuk seluruh varians. Bagian yang lebih besar daripada bobotnya berarti saham itu menambahkan bagian risiko portofolio yang lebih besar daripada bagian nilainya.",
    risksTable: measureTableForTest(
      [
        "Saham",
        "Bobot",
        "Kovarians dengan portofolio",
        "Bagian varians",
        "Korelasi dengan portofolio",
      ],
      [
        ["BBCA", "50,00%", "0,00191", "57,76%", "0,90"],
        ["TLKM", "30,00%", "0,002328", "42,24%", "0,83"],
      ],
    ),
    riskFormulas:
      "<p>σ<sub>ip</sub> = Σ<sub>j</sub> w<sub>j</sub> σ<sub>ij</sub> (SUMPRODUCT)</p><p>c<sub>i</sub> = w<sub>i</sub> σ<sub>ip</sub> / σ²<sub>p</sub></p><p>ρ<sub>ip</sub> = σ<sub>ip</sub> / (σ<sub>i</sub> σ<sub>p</sub>) (CORREL)</p>",
    summaries: [
      "<h2>IHSG dan suku bunga bebas risiko</h2>",
      "<summary>Imbal hasil bulanan IHSG</summary>",
      "<summary>Imbal hasil bulanan BBCA</summary>",
      "<summary>Imbal hasil bulanan TLKM</summary>",
    ],
  },
  en: {
    months:
      "The measures below use 60 monthly returns from October 2021 to September 2026.",
    rows: [
      [
        "Expected return",
        "-0.22%",
        "E(R<sub>p</sub>) = Σ w<sub>i</sub> E(R<sub>i</sub>) (SUMPRODUCT)",
      ],
      [
        "Variance",
        "0.001653",
        "σ²<sub>p</sub> = Σ<sub>i</sub> Σ<sub>j</sub> w<sub>i</sub> w<sub>j</sub> σ<sub>ij</sub> (MMULT)",
      ],
      [
        "Standard deviation",
        "4.07%",
        "σ<sub>p</sub> = √σ²<sub>p</sub> = √0.001653",
      ],
      [
        "Beta against the IHSG",
        "0.62",
        "β<sub>p</sub> = Σ w<sub>i</sub> β<sub>i</sub> (SUMPRODUCT)",
      ],
      [
        "Sharpe ratio",
        "-0.17",
        "S<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / σ<sub>p</sub> = (-0.22% − 0.48%) / 4.07%",
      ],
      [
        "Treynor ratio",
        "-1.12%",
        "T<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / β<sub>p</sub> = (-0.22% − 0.48%) / 0.62",
      ],
      [
        "Return that CAPM requires",
        "0.21%",
        "k<sub>p</sub> = R<sub>f</sub> + β<sub>p</sub>(E(R<sub>M</sub>) − R<sub>f</sub>) = 0.48% + 0.62 × (0.05% − 0.48%)",
      ],
      [
        "Jensen's alpha",
        `${fall}-0.43%`,
        "α<sub>p</sub> = E(R<sub>p</sub>) − k<sub>p</sub> = -0.22% − 0.21%",
      ],
    ],
    below:
      "The expected return lies below the security market line, so it is lower than the return that CAPM requires for its beta.",
    weightsTable: measureTableForTest(
      ["Stock", "Value", "Weight"],
      [
        ["BBCA", "IDR\u00a027,390,000", "50.00%"],
        ["TLKM", "IDR\u00a016,434,000", "30.00%"],
        ["Cash", "IDR\u00a010,956,000", "20.00%"],
        ["Total", "IDR\u00a054,780,000", "100.00%"],
      ],
    ),
    holdingsHeader: [
      "Stock",
      "Weight",
      "Expected return",
      "Beta against the IHSG",
    ],
    holdingsRows: [
      ["BBCA", "50.00%", "-0.10%", "0.69"],
      ["TLKM", "30.00%", "-0.55%", "0.92"],
    ],
    holdingFormulas:
      "<p>E(R<sub>i</sub>) = ΣR<sub>i</sub> / n, n = 60 (AVERAGE)</p><p>β<sub>i</sub> = σ<sub>iM</sub> / σ²<sub>M</sub> (SLOPE)</p>",
    pairsNotice:
      "The covariance of a stock with itself is its variance, and a stock correlates perfectly with itself.",
    pairsTable: measureTableForTest(
      ["Stocks", "Covariance", "Correlation"],
      [
        ["BBCA", "0.002732", "1.00"],
        ["BBCA and TLKM", "0.001811", "0.50"],
        ["TLKM", "0.00474", "1.00"],
      ],
    ),
    pairFormulas:
      "<p>σ<sub>ij</sub> = Σ(R<sub>i</sub> − E(R<sub>i</sub>))(R<sub>j</sub> − E(R<sub>j</sub>)) / (n − 1) (COVARIANCE.S)</p><p>ρ<sub>ij</sub> = σ<sub>ij</sub> / (σ<sub>i</sub> σ<sub>j</sub>) (CORREL)</p>",
    risksNotice:
      "The share of the variance of a stock is its weight times its covariance with the portfolio, divided by the variance of the portfolio, so together the shares of the stocks make up the whole variance. A share above the weight means that the stock adds more of the risk of the portfolio than of its value.",
    risksTable: measureTableForTest(
      [
        "Stock",
        "Weight",
        "Covariance with the portfolio",
        "Share of the variance",
        "Correlation with the portfolio",
      ],
      [
        ["BBCA", "50.00%", "0.00191", "57.76%", "0.90"],
        ["TLKM", "30.00%", "0.002328", "42.24%", "0.83"],
      ],
    ),
    riskFormulas:
      "<p>σ<sub>ip</sub> = Σ<sub>j</sub> w<sub>j</sub> σ<sub>ij</sub> (SUMPRODUCT)</p><p>c<sub>i</sub> = w<sub>i</sub> σ<sub>ip</sub> / σ²<sub>p</sub></p><p>ρ<sub>ip</sub> = σ<sub>ip</sub> / (σ<sub>i</sub> σ<sub>p</sub>) (CORREL)</p>",
    summaries: [
      "<h2>The IHSG and the risk-free rate</h2>",
      "<summary>Monthly returns of the IHSG</summary>",
      "<summary>Monthly returns of BBCA</summary>",
      "<summary>Monthly returns of TLKM</summary>",
    ],
  },
};

// The texts that differ between the readers of the portfolio.
const readerTexts: Record<
  Locale,
  Record<
    PortfolioReader["kind"],
    {
      weightsTitle: string;
      weightsNotice: string;
      holdingsTitle: string;
      holdingsNotice: string;
      pairsTitle: string;
      risksTitle: string;
      noHoldings: string;
      oneUnpriced: string;
      severalUnpriced: string;
    }
  >
> = {
  id: {
    owner: {
      weightsTitle: "Bobot portofolio Anda",
      weightsNotice:
        "Bobot suatu saham adalah nilainya pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, dibagi nilai total portofolio Anda, dan bobot kas Anda adalah bagiannya dari nilai total itu. Halaman portofolio Anda menunjukkan setiap harga tertunda dan waktu pencatatannya. Kas tidak menghasilkan imbal hasil di Portolab, sehingga kas tidak menambah imbal hasil yang diharapkan, varians, maupun beta.",
      holdingsTitle: "Saham Anda pada bulan-bulan ini",
      holdingsNotice:
        "Ukuran portofolio Anda berasal dari ukuran saham Anda ini pada bulan-bulan yang sama dengan portofolio, yang bisa lebih sedikit daripada bulan-bulan di halaman suatu saham.",
      pairsTitle: "Kovarians dan korelasi saham Anda",
      risksTitle: "Risiko yang ditambahkan setiap saham Anda",
      noHoldings:
        "Anda belum memegang saham, sehingga portofolio Anda hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio Anda setelah order beli Anda tereksekusi.",
      oneUnpriced:
        "Portolab menghitung ukuran portofolio Anda setelah pembaruan harga berikutnya membawa harga tertunda TLKM, karena bobot setiap saham adalah nilainya pada harga tertundanya.",
      severalUnpriced:
        "Portolab menghitung ukuran portofolio Anda setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM, karena bobot setiap saham adalah nilainya pada harga tertundanya.",
    },
    lecturer: {
      weightsTitle: "Bobot portofolio",
      weightsNotice:
        "Bobot suatu saham adalah nilainya pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, dibagi nilai total portofolio, dan bobot kas adalah bagiannya dari nilai total itu. Halaman portofolio Siti Rahayu menunjukkan setiap harga tertunda dan waktu pencatatannya. Kas tidak menghasilkan imbal hasil di Portolab, sehingga kas tidak menambah imbal hasil yang diharapkan, varians, maupun beta.",
      holdingsTitle: "Saham portofolio pada bulan-bulan ini",
      holdingsNotice:
        "Ukuran portofolio berasal dari ukuran sahamnya ini pada bulan-bulan yang sama dengan portofolio, yang bisa lebih sedikit daripada bulan-bulan yang dipakai ukuran suatu saham sendiri.",
      pairsTitle: "Kovarians dan korelasi saham portofolio",
      risksTitle: "Risiko yang ditambahkan setiap saham portofolio",
      noHoldings:
        "Siti Rahayu belum memegang saham, sehingga portofolionya hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio itu setelah order beli Siti Rahayu tereksekusi.",
      oneUnpriced:
        "Portolab menilai portofolio Siti Rahayu dan menghitung ukurannya setelah pembaruan harga berikutnya membawa harga tertunda TLKM, karena nilai dan bobot setiap saham berasal dari harga tertundanya.",
      severalUnpriced:
        "Portolab menilai portofolio Siti Rahayu dan menghitung ukurannya setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM, karena nilai dan bobot setiap saham berasal dari harga tertundanya.",
    },
  },
  en: {
    owner: {
      weightsTitle: "Weights of your portfolio",
      weightsNotice:
        "The weight of a stock is its value at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, divided by the total value of your portfolio, and the weight of your cash is its share of that total. The page of your portfolio shows each delayed price and when it was quoted. Cash earns no return in Portolab, so it adds nothing to the expected return, the variance, or the beta.",
      holdingsTitle: "Your stocks in these months",
      holdingsNotice:
        "The measures of your portfolio come from these measures of your stocks over the same months as the portfolio, which can be fewer than the months on the page of a stock.",
      pairsTitle: "Covariances and correlations of your stocks",
      risksTitle: "The risk that each of your stocks adds",
      noHoldings:
        "You hold no shares yet, so your portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of your portfolio once a purchase of yours fills.",
      oneUnpriced:
        "Portolab computes the measures of your portfolio once the next update of prices brings a delayed price of TLKM, because the weight of each stock is its value at its delayed price.",
      severalUnpriced:
        "Portolab computes the measures of your portfolio once the next update of prices brings the delayed prices of BBCA and TLKM, because the weight of each stock is its value at its delayed price.",
    },
    lecturer: {
      weightsTitle: "Weights of the portfolio",
      weightsNotice:
        "The weight of a stock is its value at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, divided by the total value of the portfolio, and the weight of the cash is its share of that total. The page of the portfolio of Siti Rahayu shows each delayed price and when it was quoted. Cash earns no return in Portolab, so it adds nothing to the expected return, the variance, or the beta.",
      holdingsTitle: "The stocks of the portfolio in these months",
      holdingsNotice:
        "The measures of the portfolio come from these measures of its stocks over the same months as the portfolio, which can be fewer than the months that the measures of a stock alone use.",
      pairsTitle: "Covariances and correlations of the stocks of the portfolio",
      risksTitle: "The risk that each stock of the portfolio adds",
      noHoldings:
        "Siti Rahayu holds no shares yet, so the portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of the portfolio once a purchase of Siti Rahayu fills.",
      oneUnpriced:
        "Portolab values the portfolio of Siti Rahayu and computes its measures once the next update of prices brings a delayed price of TLKM, because the value and the weight of each stock come from its delayed price.",
      severalUnpriced:
        "Portolab values the portfolio of Siti Rahayu and computes its measures once the next update of prices brings the delayed prices of BBCA and TLKM, because the value and the weight of each stock come from its delayed price.",
    },
  },
};

for (const locale of locales) {
  for (const [readerKind, reader] of Object.entries(readers)) {
    const text = texts[locale];
    const readerText = readerTexts[locale][reader.kind];
    const language = `${languageNames[locale]}, for the ${readerKind}`;
    const render = (
      report: PortfolioMeasuresReport,
      quoteFailure: string | undefined,
    ): string => renderView(report, reader, quoteFailure);

    test(`shows each measure of a portfolio with its formula, the weights, the measures of its stocks, their covariances and correlations, the risk that each stock adds, the IHSG, and the monthly returns, in ${language}`, () => {
      switchLocaleForTest(locale);
      const quoteFailure = quoteFailureForTest();
      const html = render(
        readPortfolioMeasures(
          databaseWithClosesForTest(),
          valuationForTest(["BBCA", "TLKM"]),
        ),
        quoteFailure,
      );
      expect(html).toContain(
        [
          `<p>${text.months}</p>`,
          `<dl>${measureDefinitionsForTest(text.rows)}</dl>`,
          `<p>${text.below}</p>`,
          `<h2>${readerText.weightsTitle}</h2>`,
          `<p>${readerText.weightsNotice}</p>`,
          `<p>${quoteFailure ?? ""}</p>`,
          text.weightsTable,
          `<h2>${readerText.holdingsTitle}</h2>`,
          `<p>${readerText.holdingsNotice}</p>`,
          measureTableForTest(
            text.holdingsHeader,
            text.holdingsRows.map(([code, ...cells]) => [
              stockNames[reader.kind](code),
              ...cells,
            ]),
          ),
          text.holdingFormulas,
          `<h2>${readerText.pairsTitle}</h2>`,
          `<p>${text.pairsNotice}</p>`,
          text.pairsTable,
          text.pairFormulas,
          `<h2>${readerText.risksTitle}</h2>`,
          `<p>${text.risksNotice}</p>`,
          text.risksTable,
          text.riskFormulas,
        ].join(""),
      );
      for (const part of text.summaries) {
        expect(html).toContain(part);
      }
      expect(
        render(
          readPortfolioMeasures(
            databaseWithClosesForTest(),
            valuationForTest(["BBCA", "TLKM"]),
          ),
          undefined,
        ),
      ).toContain(`<p>${readerText.weightsNotice}</p>${text.weightsTable}`);
    });

    test(`says that a portfolio without shares has no measures yet, in ${language}`, () => {
      switchLocaleForTest(locale);
      const report = readPortfolioMeasures(
        databaseWithClosesForTest(),
        cashValuationForTest(),
      );
      expect(render(report, undefined)).toBe(`<p>${readerText.noHoldings}</p>`);
    });

    test(`names one holding or several without a delayed price, after the prices that the latest update could not fetch, in ${language}`, () => {
      switchLocaleForTest(locale);
      const database = databaseWithClosesForTest();
      const quoteFailure = quoteFailureForTest();
      expect(
        render(
          readPortfolioMeasures(database, valuationForTest(["BBCA"])),
          quoteFailure,
        ),
      ).toBe(`<p>${quoteFailure ?? ""}</p><p>${readerText.oneUnpriced}</p>`);
      expect(
        render(
          readPortfolioMeasures(database, valuationForTest([])),
          undefined,
        ),
      ).toBe(`<p>${readerText.severalUnpriced}</p>`);
    });

    test(`says why a portfolio whose stocks share too few returns has no measures, in ${language}`, () => {
      switchLocaleForTest(locale);
      const report = readPortfolioMeasures(
        databaseWithClosesForTest(),
        aadiValuationForTest(),
      );
      if (report.kind !== "measured" || report.measures.ok) {
        throw new Error("AADI has too few monthly returns for measures.");
      }
      expect(render(report, undefined)).toBe(
        `<p>${measureFailureText(report.measures.failure, { kind: "portfolio", reader })}</p>`,
      );
    });
  }
}

// The decimal module of Python computed the measures of that portfolio from the same closes at 50 significant digits: an expected return of 0.000828, a standard deviation of 0.023833, a beta of -0.524884, and a Sharpe ratio of -0.166294.
const againstMarketTexts: Record<
  Locale,
  readonly (readonly [string, string, string])[]
> = {
  id: [
    [
      "Rasio Sharpe",
      "-0,17",
      "S<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / σ<sub>p</sub> = (0,08% − 0,48%) / 2,38%",
    ],
    [
      "Rasio Treynor",
      "Tidak ada",
      `T<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / β<sub>p</sub> = (0,08% − 0,48%) / (-0,52)<span>${negativeTreynorTextForTest.id}</span>`,
    ],
  ],
  en: [
    [
      "Sharpe ratio",
      "-0.17",
      "S<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / σ<sub>p</sub> = (0.08% − 0.48%) / 2.38%",
    ],
    [
      "Treynor ratio",
      "None",
      `T<sub>p</sub> = (E(R<sub>p</sub>) − R<sub>f</sub>) / β<sub>p</sub> = (0.08% − 0.48%) / (-0.52)<span>${negativeTreynorTextForTest.en}</span>`,
    ],
  ],
};

for (const locale of locales) {
  test(`shows no Treynor ratio for a portfolio whose beta is below zero, with the division by its beta and the reason, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const report = portfolioAgainstMarketForTest();
    if (report.kind !== "measured" || !report.measures.ok) {
      throw new Error("The portfolio against the market has measures.");
    }
    expect(report.measures.value.beta).toBeLessThan(0);
    expect(renderView(report, readers.owner, undefined)).toContain(
      measureDefinitionsForTest(againstMarketTexts[locale]),
    );
  });
}
