import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { withoutConceptCardsForTest } from "~/concept-card-markup-for-test";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { formulaMarkupForTest } from "~/math-text-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { measureDefinitionsForTest } from "./measure-definitions-for-test";
import { measureFailureText } from "./measure-failure-text";
import { databaseWithClosesForTest } from "./measures-for-test.server";
import { readStockMeasures } from "./read-measures.server";
import { StockMeasuresView } from "./stock-measures-view";

// The measures of BBCA and AMMN that the decimal module of Python computed, as measure-stock.test.ts gives them: for BBCA an expected return of -0.001023, a variance of 0.002732, a standard deviation of 0.052272, a covariance with the IHSG of 0.001413, a correlation of 0.596994, a beta of 0.689371, a required return of 0.001803, and a distance of -0.002826 from the security market line, and for AMMN an expected return of 0.028220, a beta of 1.110656, a required return of -0.002765, and a distance of 0.030986. The IHSG has an expected return of 0.000457 and a variance of 0.002049 over the months of BBCA, and an expected return of -0.002012 over those of AMMN. The standard deviation of the IHSG over the months of BBCA is the square root of its variance, 0.045268, and the risk-free rate is the BI-Rate of 5.75% that Bank Indonesia set on 18 June 2026, divided by 12. The formulas show the sums behind the expected returns, the variances, and the covariance, which return-statistics.test.ts checks: the 60 returns of BBCA add up to -6.14% and those of the IHSG to 2.74%, their squared deviations to 0.1612 and 0.1209, and the products of their deviations to 0.08334.
function render(code: string): string {
  return withoutConceptCardsForTest(
    renderInRouterForTest(
      <StockMeasuresView
        code={code}
        measures={readStockMeasures(databaseWithClosesForTest(), code)}
      />,
      conceptLessonDataForTest(),
    ),
  ).replaceAll(/ class="[^"]*"/g, "");
}

const fall = '<span aria-hidden="true">▼ </span>';
const rise = '<span aria-hidden="true">▲ </span>';

const texts: Record<
  Locale,
  {
    bbcaMonths: string;
    bbcaRows: readonly (readonly [string, string, string, string])[];
    below: string;
    ammnMonths: string;
    ammnRows: readonly (readonly [string, string, string, string])[];
    above: string;
    marketTitle: string;
    marketRows: readonly (readonly [string, string, string, string])[];
    rateNotice: string;
    rateLink: string;
    returnsTitle: string;
  }
> = {
  id: {
    bbcaMonths:
      "Ukuran di bawah memakai 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    bbcaRows: [
      [
        "Imbal hasil harapan",
        "-0,10%",
        "Jumlah imbal hasil bulanan dibagi banyaknya bulan, yaitu rata-ratanya.",
        formulaMarkupForTest(
          String.raw`E(R_i) = \frac{∑R_i}{n} \\ = \frac{-6,14%}{60}`,
          "AVERAGE",
        ),
      ],
      [
        "Varians",
        "0,002732",
        "Jumlah kuadrat selisih setiap imbal hasil bulanan dari rata-ratanya, dibagi banyaknya bulan dikurangi satu.",
        formulaMarkupForTest(
          String.raw`σ_i^2 = \frac{∑(R_i − E(R_i))^2}{n − 1} \\ = \frac{0,1612}{60 − 1}`,
          "VAR.S",
        ),
      ],
      [
        "Simpangan baku",
        "5,23%",
        "Akar kuadrat varians, sehingga sebarannya kembali dalam persen per bulan seperti imbal hasilnya.",
        formulaMarkupForTest(
          String.raw`σ_i = \sqrt{σ_i^2} \\ = \sqrt{0,002732}`,
          "STDEV.S",
        ),
      ],
      [
        "Kovarians dengan IHSG",
        "0,001413",
        "Jumlah hasil kali selisih kedua imbal hasil dari rata-ratanya pada bulan yang sama, dibagi banyaknya bulan dikurangi satu.",
        formulaMarkupForTest(
          String.raw`σ_{iM} = \frac{∑(R_i − E(R_i))(R_M − E(R_M))}{n − 1} \\ = \frac{0,08334}{60 − 1}`,
          "COVARIANCE.S",
        ),
      ],
      [
        "Korelasi dengan IHSG",
        "0,60",
        "Kovarians dibagi hasil kali kedua simpangan baku, sehingga nilainya selalu antara -1 dan 1.",
        formulaMarkupForTest(
          String.raw`ρ_{iM} = \frac{σ_{iM}}{σ_iσ_M} \\ = \frac{0,001413}{5,23% × 4,53%}`,
          "CORREL",
        ),
      ],
      [
        "Beta terhadap IHSG",
        "0,69",
        "Kovarians saham dengan IHSG dibagi varians IHSG, yaitu kemiringan garis dari imbal hasil IHSG ke imbal hasil saham.",
        formulaMarkupForTest(
          String.raw`β_i = \frac{σ_{iM}}{σ_M^2} \\ = \frac{0,001413}{0,002049}`,
          "SLOPE",
        ),
      ],
      [
        "Imbal hasil yang disyaratkan CAPM",
        "0,18%",
        "Suku bunga bebas risiko ditambah beta dikali selisih imbal hasil harapan IHSG dengan suku bunga bebas risiko.",
        formulaMarkupForTest(
          String.raw`k_i = R_f + β_i(E(R_M) − R_f) \\ = 0,48% + 0,69 × (0,05% − 0,48%)`,
        ),
      ],
      [
        "Alpha Jensen",
        `<span data-change="fall">${fall}-0,28%</span>`,
        "Imbal hasil harapan dikurangi imbal hasil yang disyaratkan CAPM untuk betanya.",
        formulaMarkupForTest(
          String.raw`α_i = E(R_i) − k_i \\ = -0,10% − 0,18%`,
        ),
      ],
    ],
    below:
      "Imbal hasil harapan berada di bawah garis pasar sekuritas, sehingga lebih rendah daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    ammnMonths:
      "Ukuran di bawah memakai 38 imbal hasil bulanan dari Agustus 2023 sampai September 2026.",
    ammnRows: [
      [
        "Imbal hasil yang disyaratkan CAPM",
        "-0,28%",
        "Suku bunga bebas risiko ditambah beta dikali selisih imbal hasil harapan IHSG dengan suku bunga bebas risiko.",
        formulaMarkupForTest(
          String.raw`k_i = R_f + β_i(E(R_M) − R_f) \\ = 0,48% + 1,11 × (-0,20% − 0,48%)`,
        ),
      ],
      [
        "Alpha Jensen",
        `<span data-change="rise">${rise}+3,10%</span>`,
        "Imbal hasil harapan dikurangi imbal hasil yang disyaratkan CAPM untuk betanya.",
        formulaMarkupForTest(
          String.raw`α_i = E(R_i) − k_i \\ = 2,82% − (-0,28%)`,
        ),
      ],
    ],
    above:
      "Imbal hasil harapan berada di atas garis pasar sekuritas, sehingga lebih tinggi daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    marketTitle: "IHSG dan suku bunga bebas risiko",
    marketRows: [
      [
        "Imbal hasil harapan IHSG",
        "0,05%",
        "Jumlah imbal hasil bulanan dibagi banyaknya bulan, yaitu rata-ratanya.",
        formulaMarkupForTest(
          String.raw`E(R_M) = \frac{∑R_M}{n} \\ = \frac{2,74%}{60}`,
          "AVERAGE",
        ),
      ],
      [
        "Varians IHSG",
        "0,002049",
        "Jumlah kuadrat selisih setiap imbal hasil bulanan dari rata-ratanya, dibagi banyaknya bulan dikurangi satu.",
        formulaMarkupForTest(
          String.raw`σ_M^2 = \frac{∑(R_M − E(R_M))^2}{n − 1} \\ = \frac{0,1209}{60 − 1}`,
          "VAR.S",
        ),
      ],
      [
        "Simpangan baku IHSG",
        "4,53%",
        "Akar kuadrat varians, sehingga sebarannya kembali dalam persen per bulan seperti imbal hasilnya.",
        formulaMarkupForTest(
          String.raw`σ_M = \sqrt{σ_M^2} \\ = \sqrt{0,002049}`,
          "STDEV.S",
        ),
      ],
      [
        "Suku bunga bebas risiko",
        "0,48%",
        "BI-Rate per tahun dibagi 12, yaitu suku bunga bebas risiko untuk satu bulan.",
        formulaMarkupForTest(
          String.raw`R_f = \frac{BI-Rate}{12} \\ = \frac{5,75%}{12}`,
        ),
      ],
    ],
    rateNotice:
      "Portolab memakai BI-Rate sebagai suku bunga bebas risiko. Bank Indonesia menetapkan BI-Rate sebesar 5,75% pada 18 Juni 2026, dan suku bunga itu masih berlaku pada akhir bulan terakhir dari imbal hasil tersebut.",
    rateLink: "BI-Rate di situs Bank Indonesia",
    returnsTitle: "Imbal hasil bulanan",
  },
  en: {
    bbcaMonths:
      "The measures below use 60 monthly returns from October 2021 to September 2026.",
    bbcaRows: [
      [
        "Expected return",
        "-0.10%",
        "The sum of the monthly returns divided by the number of months, which is their average.",
        formulaMarkupForTest(
          String.raw`E(R_i) = \frac{∑R_i}{n} \\ = \frac{-6.14%}{60}`,
          "AVERAGE",
        ),
      ],
      [
        "Variance",
        "0.002732",
        "The sum of the squared differences of each monthly return from their average, divided by the number of months less one.",
        formulaMarkupForTest(
          String.raw`σ_i^2 = \frac{∑(R_i − E(R_i))^2}{n − 1} \\ = \frac{0.1612}{60 − 1}`,
          "VAR.S",
        ),
      ],
      [
        "Standard deviation",
        "5.23%",
        "The square root of the variance, so the spread is in percent a month again, as the returns are.",
        formulaMarkupForTest(
          String.raw`σ_i = \sqrt{σ_i^2} \\ = \sqrt{0.002732}`,
          "STDEV.S",
        ),
      ],
      [
        "Covariance with the IHSG",
        "0.001413",
        "The sum of the products of the differences of both returns from their averages in the same month, divided by the number of months less one.",
        formulaMarkupForTest(
          String.raw`σ_{iM} = \frac{∑(R_i − E(R_i))(R_M − E(R_M))}{n − 1} \\ = \frac{0.08334}{60 − 1}`,
          "COVARIANCE.S",
        ),
      ],
      [
        "Correlation with the IHSG",
        "0.60",
        "The covariance divided by the product of both standard deviations, so the value always lies between -1 and 1.",
        formulaMarkupForTest(
          String.raw`ρ_{iM} = \frac{σ_{iM}}{σ_iσ_M} \\ = \frac{0.001413}{5.23% × 4.53%}`,
          "CORREL",
        ),
      ],
      [
        "Beta against the IHSG",
        "0.69",
        "The covariance of the stock with the IHSG divided by the variance of the IHSG, which is the slope of the line from the returns of the IHSG to those of the stock.",
        formulaMarkupForTest(
          String.raw`β_i = \frac{σ_{iM}}{σ_M^2} \\ = \frac{0.001413}{0.002049}`,
          "SLOPE",
        ),
      ],
      [
        "Return that CAPM requires",
        "0.18%",
        "The risk-free rate plus the beta times the expected return of the IHSG above the risk-free rate.",
        formulaMarkupForTest(
          String.raw`k_i = R_f + β_i(E(R_M) − R_f) \\ = 0.48% + 0.69 × (0.05% − 0.48%)`,
        ),
      ],
      [
        "Jensen's alpha",
        `<span data-change="fall">${fall}-0.28%</span>`,
        "The expected return less the return that CAPM requires for its beta.",
        formulaMarkupForTest(
          String.raw`α_i = E(R_i) − k_i \\ = -0.10% − 0.18%`,
        ),
      ],
    ],
    below:
      "The expected return lies below the security market line, so it is lower than the return that CAPM requires for its beta.",
    ammnMonths:
      "The measures below use 38 monthly returns from August 2023 to September 2026.",
    ammnRows: [
      [
        "Return that CAPM requires",
        "-0.28%",
        "The risk-free rate plus the beta times the expected return of the IHSG above the risk-free rate.",
        formulaMarkupForTest(
          String.raw`k_i = R_f + β_i(E(R_M) − R_f) \\ = 0.48% + 1.11 × (-0.20% − 0.48%)`,
        ),
      ],
      [
        "Jensen's alpha",
        `<span data-change="rise">${rise}+3.10%</span>`,
        "The expected return less the return that CAPM requires for its beta.",
        formulaMarkupForTest(
          String.raw`α_i = E(R_i) − k_i \\ = 2.82% − (-0.28%)`,
        ),
      ],
    ],
    above:
      "The expected return lies above the security market line, so it is higher than the return that CAPM requires for its beta.",
    marketTitle: "The IHSG and the risk-free rate",
    marketRows: [
      [
        "Expected return of the IHSG",
        "0.05%",
        "The sum of the monthly returns divided by the number of months, which is their average.",
        formulaMarkupForTest(
          String.raw`E(R_M) = \frac{∑R_M}{n} \\ = \frac{2.74%}{60}`,
          "AVERAGE",
        ),
      ],
      [
        "Variance of the IHSG",
        "0.002049",
        "The sum of the squared differences of each monthly return from their average, divided by the number of months less one.",
        formulaMarkupForTest(
          String.raw`σ_M^2 = \frac{∑(R_M − E(R_M))^2}{n − 1} \\ = \frac{0.1209}{60 − 1}`,
          "VAR.S",
        ),
      ],
      [
        "Standard deviation of the IHSG",
        "4.53%",
        "The square root of the variance, so the spread is in percent a month again, as the returns are.",
        formulaMarkupForTest(
          String.raw`σ_M = \sqrt{σ_M^2} \\ = \sqrt{0.002049}`,
          "STDEV.S",
        ),
      ],
      [
        "Risk-free rate",
        "0.48%",
        "The yearly BI-Rate divided by 12, which is the risk-free rate of one month.",
        formulaMarkupForTest(
          String.raw`R_f = \frac{BI-Rate}{12} \\ = \frac{5.75%}{12}`,
        ),
      ],
    ],
    rateNotice:
      "Portolab takes the BI-Rate as the risk-free rate. Bank Indonesia set the BI-Rate at 5.75% on June 18, 2026, and that rate held at the end of the last month of the returns.",
    rateLink: "The BI-Rate on the site of Bank Indonesia",
    returnsTitle: "Monthly returns",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`shows each measure of a stock with what its formula computes, its formula, and its numbers, the position below the security market line, the measures of the IHSG with the BI-Rate behind the risk-free rate, and the monthly returns, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = render("BBCA");
    expect(html).toContain(
      `<p>${text.bbcaMonths}</p><dl>${measureDefinitionsForTest(text.bbcaRows)}</dl><p>${text.below}</p>`,
    );
    expect(html).toContain(
      [
        `<h2>${text.marketTitle}</h2>`,
        `<dl>${measureDefinitionsForTest(text.marketRows)}</dl>`,
        `<p>${text.rateNotice}</p>`,
        `<a href="https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx">${text.rateLink}</a>`,
        `<h2>${text.returnsTitle}</h2>`,
      ].join(""),
    );
  });

  test(`measures a stock that listed later over the months that it shares with the IHSG, and puts a negative operand of a formula in parentheses, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = render("AMMN");
    expect(html).toContain(`<p>${text.ammnMonths}</p>`);
    expect(html).toContain(
      `${measureDefinitionsForTest(text.ammnRows)}</dl><p>${text.above}</p>`,
    );
  });

  test(`says why a stock has no measures, and shows none, in ${language}`, () => {
    switchLocaleForTest(locale);
    const database = databaseWithClosesForTest();
    const measures = readStockMeasures(database, "AADI");
    if (measures.ok) {
      throw new Error("AADI has too few monthly returns for measures.");
    }
    expect(
      renderInRouterForTest(
        <StockMeasuresView code="AADI" measures={measures} />,
      ),
    ).toBe(
      `<p>${measureFailureText(measures.failure, { kind: "stock", code: "AADI" })}</p>`,
    );
  });
}
