import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { valuePortfolio } from "~/features/trading/value-portfolio";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { measureDefinitionsForTest } from "./measure-definitions-for-test";
import { measureFailureText } from "./measure-failure-text";
import {
  aadiValuationForTest,
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { PortfolioMeasuresView } from "./portfolio-measures-view";
import { readPortfolioMeasures } from "./read-measures.server";
import type { PortfolioMeasuresReport } from "./read-measures.server";

// The portfolio of measures-for-test.server.ts holds BBCA, TLKM, and cash at weights of 0.5, 0.3, and 0.2. read-measures.server.test.ts explains its measures, which come from the values that the decimal module of Python computed for BBCA and TLKM: an expected return of -0.002159, a variance of 0.001653, a standard deviation of 0.040657, a beta of 0.620693, a required return of 0.002101, and a distance of -0.004260 from the security market line. Intl puts a no-break space after the currency, which the texts write as \u00a0.
const classId = 7 as ClassId;
const yahooFinance: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};

function render(
  report: PortfolioMeasuresReport,
  quoteFailure: string | undefined,
): string {
  return renderInRouterForTest(
    <PortfolioMeasuresView
      classId={classId}
      report={report}
      quoteFailure={quoteFailure}
      source={yahooFinance}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

/** The sentences about a partial update of prices at 16:15 WIB on Friday 30 October 2026 that did not update TLKM, seen half a minute later. */
function quoteFailureForTest(): string | undefined {
  return holdingQuoteFailureText(
    {
      valuation: valuationForTest(["BBCA", "TLKM"]),
      quoteAttempt: {
        attemptedAt: new Date("2026-10-30T09:15:00Z"),
        succeeded: true,
        consecutiveFailures: 0,
        failedCodes: ["TLKM"],
      },
    },
    { now: new Date("2026-10-30T09:15:30Z"), delayMinutes: 10 },
  );
}

function link(code: string): string {
  return `<a href="/classes/7/measures/${code}" data-discover="true">${code}</a>`;
}

function table(
  header: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const head = header.map((label) => `<th scope="col">${label}</th>`).join("");
  const body = rows
    .map(
      ([name, ...cells]) =>
        `<tr><th scope="row">${name ?? ""}</th>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const fall = '<span aria-hidden="true">▼ </span>';

const texts: Record<
  Locale,
  {
    months: string;
    rows: readonly (readonly [string, string, string])[];
    below: string;
    weightsTitle: string;
    weightsNotice: string;
    weightsTable: string;
    holdingsTitle: string;
    holdingsNotice: string;
    holdingsTable: string;
    holdingFormulas: string;
    pairsTitle: string;
    pairsNotice: string;
    pairsTable: string;
    pairFormulas: string;
    summaries: readonly string[];
    noHoldings: string;
    oneUnpriced: string;
    severalUnpriced: string;
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
        "Imbal hasil yang disyaratkan CAPM",
        "0,21%",
        "k<sub>p</sub> = R<sub>f</sub> + β<sub>p</sub>(E(R<sub>M</sub>) − R<sub>f</sub>) = 0,48% + 0,62 × (0,05% − 0,48%)",
      ],
      [
        "Jarak dari garis pasar sekuritas",
        `${fall}-0,43%`,
        "α<sub>p</sub> = E(R<sub>p</sub>) − k<sub>p</sub> = -0,22% − 0,21%",
      ],
    ],
    below:
      "Imbal hasil yang diharapkan berada di bawah garis pasar sekuritas, sehingga lebih rendah daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    weightsTitle: "Bobot portofolio Anda",
    weightsNotice:
      "Bobot suatu saham adalah nilainya pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, dibagi nilai total portofolio Anda, dan bobot kas Anda adalah bagiannya dari nilai total itu. Halaman portofolio Anda menunjukkan setiap harga tertunda dan waktu pencatatannya. Kas tidak menghasilkan imbal hasil di Portolab, sehingga kas tidak menambah imbal hasil yang diharapkan, varians, maupun beta.",
    weightsTable: table(
      ["Saham", "Nilai", "Bobot"],
      [
        ["BBCA", "Rp\u00a027.390.000", "50,00%"],
        ["TLKM", "Rp\u00a016.434.000", "30,00%"],
        ["Kas", "Rp\u00a010.956.000", "20,00%"],
        ["Total", "Rp\u00a054.780.000", "100,00%"],
      ],
    ),
    holdingsTitle: "Saham Anda pada bulan-bulan ini",
    holdingsNotice:
      "Ukuran portofolio Anda berasal dari ukuran saham Anda ini pada bulan-bulan yang sama dengan portofolio, yang bisa lebih sedikit daripada bulan-bulan di halaman suatu saham.",
    holdingsTable: table(
      ["Saham", "Bobot", "Imbal hasil yang diharapkan", "Beta terhadap IHSG"],
      [
        [link("BBCA"), "50,00%", "-0,10%", "0,69"],
        [link("TLKM"), "30,00%", "-0,55%", "0,92"],
      ],
    ),
    holdingFormulas:
      "<p>E(R<sub>i</sub>) = ΣR<sub>i</sub> / n, n = 60 (AVERAGE)</p><p>β<sub>i</sub> = σ<sub>iM</sub> / σ²<sub>M</sub> (SLOPE)</p>",
    pairsTitle: "Kovarians dan korelasi saham Anda",
    pairsNotice:
      "Kovarians suatu saham dengan dirinya sendiri adalah variansnya, dan korelasi suatu saham dengan dirinya sendiri sempurna.",
    pairsTable: table(
      ["Saham", "Kovarians", "Korelasi"],
      [
        ["BBCA", "0,002732", "1,00"],
        ["BBCA dan TLKM", "0,001811", "0,50"],
        ["TLKM", "0,00474", "1,00"],
      ],
    ),
    pairFormulas:
      "<p>σ<sub>ij</sub> = Σ(R<sub>i</sub> − E(R<sub>i</sub>))(R<sub>j</sub> − E(R<sub>j</sub>)) / (n − 1) (COVARIANCE.S)</p><p>ρ<sub>ij</sub> = σ<sub>ij</sub> / (σ<sub>i</sub> σ<sub>j</sub>) (CORREL)</p>",
    summaries: [
      "<h2>IHSG dan suku bunga bebas risiko</h2>",
      "<summary>Imbal hasil bulanan IHSG</summary>",
      "<summary>Imbal hasil bulanan BBCA</summary>",
      "<summary>Imbal hasil bulanan TLKM</summary>",
    ],
    noHoldings:
      "Anda belum memegang saham, sehingga portofolio Anda hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio Anda setelah order beli Anda tereksekusi.",
    oneUnpriced:
      "Portolab menghitung ukuran portofolio Anda setelah pembaruan harga berikutnya membawa harga tertunda TLKM, karena bobot setiap saham adalah nilainya pada harga tertundanya.",
    severalUnpriced:
      "Portolab menghitung ukuran portofolio Anda setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM, karena bobot setiap saham adalah nilainya pada harga tertundanya.",
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
        "Return that CAPM requires",
        "0.21%",
        "k<sub>p</sub> = R<sub>f</sub> + β<sub>p</sub>(E(R<sub>M</sub>) − R<sub>f</sub>) = 0.48% + 0.62 × (0.05% − 0.48%)",
      ],
      [
        "Distance from the security market line",
        `${fall}-0.43%`,
        "α<sub>p</sub> = E(R<sub>p</sub>) − k<sub>p</sub> = -0.22% − 0.21%",
      ],
    ],
    below:
      "The expected return lies below the security market line, so it is lower than the return that CAPM requires for its beta.",
    weightsTitle: "Weights of your portfolio",
    weightsNotice:
      "The weight of a stock is its value at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, divided by the total value of your portfolio, and the weight of your cash is its share of that total. The page of your portfolio shows each delayed price and when it was quoted. Cash earns no return in Portolab, so it adds nothing to the expected return, the variance, or the beta.",
    weightsTable: table(
      ["Stock", "Value", "Weight"],
      [
        ["BBCA", "IDR\u00a027,390,000", "50.00%"],
        ["TLKM", "IDR\u00a016,434,000", "30.00%"],
        ["Cash", "IDR\u00a010,956,000", "20.00%"],
        ["Total", "IDR\u00a054,780,000", "100.00%"],
      ],
    ),
    holdingsTitle: "Your stocks in these months",
    holdingsNotice:
      "The measures of your portfolio come from these measures of your stocks over the same months as the portfolio, which can be fewer than the months on the page of a stock.",
    holdingsTable: table(
      ["Stock", "Weight", "Expected return", "Beta against the IHSG"],
      [
        [link("BBCA"), "50.00%", "-0.10%", "0.69"],
        [link("TLKM"), "30.00%", "-0.55%", "0.92"],
      ],
    ),
    holdingFormulas:
      "<p>E(R<sub>i</sub>) = ΣR<sub>i</sub> / n, n = 60 (AVERAGE)</p><p>β<sub>i</sub> = σ<sub>iM</sub> / σ²<sub>M</sub> (SLOPE)</p>",
    pairsTitle: "Covariances and correlations of your stocks",
    pairsNotice:
      "The covariance of a stock with itself is its variance, and a stock correlates perfectly with itself.",
    pairsTable: table(
      ["Stocks", "Covariance", "Correlation"],
      [
        ["BBCA", "0.002732", "1.00"],
        ["BBCA and TLKM", "0.001811", "0.50"],
        ["TLKM", "0.00474", "1.00"],
      ],
    ),
    pairFormulas:
      "<p>σ<sub>ij</sub> = Σ(R<sub>i</sub> − E(R<sub>i</sub>))(R<sub>j</sub> − E(R<sub>j</sub>)) / (n − 1) (COVARIANCE.S)</p><p>ρ<sub>ij</sub> = σ<sub>ij</sub> / (σ<sub>i</sub> σ<sub>j</sub>) (CORREL)</p>",
    summaries: [
      "<h2>The IHSG and the risk-free rate</h2>",
      "<summary>Monthly returns of IHSG</summary>",
      "<summary>Monthly returns of BBCA</summary>",
      "<summary>Monthly returns of TLKM</summary>",
    ],
    noHoldings:
      "You hold no shares yet, so your portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of your portfolio once a purchase of yours fills.",
    oneUnpriced:
      "Portolab computes the measures of your portfolio once the next update of prices brings a delayed price of TLKM, because the weight of each stock is its value at its delayed price.",
    severalUnpriced:
      "Portolab computes the measures of your portfolio once the next update of prices brings the delayed prices of BBCA and TLKM, because the weight of each stock is its value at its delayed price.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`shows each measure of a portfolio with its formula, the weights, the measures of its stocks, their covariances and correlations, the IHSG, and the monthly returns, in ${language}`, () => {
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
        `<h2>${text.weightsTitle}</h2>`,
        `<p>${text.weightsNotice}</p>`,
        `<p>${quoteFailure ?? ""}</p>`,
        text.weightsTable,
        `<h2>${text.holdingsTitle}</h2>`,
        `<p>${text.holdingsNotice}</p>`,
        text.holdingsTable,
        text.holdingFormulas,
        `<h2>${text.pairsTitle}</h2>`,
        `<p>${text.pairsNotice}</p>`,
        text.pairsTable,
        text.pairFormulas,
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
    ).toContain(`<p>${text.weightsNotice}</p>${text.weightsTable}`);
  });

  test(`says that a portfolio without shares has no measures yet, in ${language}`, () => {
    switchLocaleForTest(locale);
    const report = readPortfolioMeasures(
      databaseWithClosesForTest(),
      valuePortfolio(
        { cash: rupiah(100_000_000), holdings: [] },
        rupiah(100_000_000),
        new Map(),
      ),
    );
    expect(render(report, undefined)).toBe(`<p>${text.noHoldings}</p>`);
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
    ).toBe(`<p>${quoteFailure ?? ""}</p><p>${text.oneUnpriced}</p>`);
    expect(
      render(readPortfolioMeasures(database, valuationForTest([])), undefined),
    ).toBe(`<p>${text.severalUnpriced}</p>`);
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
      `<p>${measureFailureText(report.measures.failure, { kind: "portfolio" })}</p>`,
    );
  });
}
