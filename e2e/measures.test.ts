import { expect, test } from "@playwright/test";
import type { Browser, Locator, Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { bbcaHolding } from "./bbca-holding.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { expectTexts } from "./expect-texts.ts";
import { expectPageHeadings } from "./expect-page-headings.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import type { PortfolioOfTest } from "./student-with-portfolio.ts";
import { widestClassNames } from "./widest-class-names.ts";

// The server runs with the fixture price source, whose quotes are the closes of Friday 30 October 2026, and the global setup stores the month-end closes that give BBCA 60 monthly returns, AMMN 38, and AADI 21, and no closes of ADMR. bbca-holding.ts describes the portfolio of the student, in which BBCA has a weight of 0.496382. The measures of the portfolio follow from those of BBCA that the decimal module of Python computed, as measure-stock.test.ts gives them: an expected return of -0.000508, a variance of 0.000673, a standard deviation of 0.025947, a beta of 0.342192, a required return of 0.003308, and a distance of -0.003816 from the security market line.
const { className } = widestClassNames;

/** What a point of the map gives a reader: its name beside its mark, the text that a screen reader reads as the value of the slider, and the lines of its tooltip, its name and then each value after its measure, a change after its arrow. */
interface MapPointText {
  name: string;
  spoken: string;
  tip: readonly string[];
}

/** The texts of a point from its name and each of its values as a measure, the arrow of a change or none, and the value, joined into a list with the word for "and" of a language. */
function mapPointText(
  name: string,
  values: readonly (readonly [string, string, string])[],
  and: string,
): MapPointText {
  const spoken = values.map(([measure, , value]) => `${measure} ${value}`);
  return {
    name,
    spoken: `${name}: ${spoken.slice(0, -1).join(", ")}, ${and} ${spoken.at(-1) ?? ""}`,
    tip: [
      name,
      ...values.map(([measure, arrow, value]) => `${measure}${arrow}${value}`),
    ],
  };
}

const texts: Record<
  Locale,
  {
    classLink: string;
    title: string;
    backLink: string;
    portfolioLink: string;
    ordersLink: string;
    measuresLink: string;
    methodNotice: string;
    headings: readonly string[];
    months: string;
    measures: string;
    below: string;
    weights: readonly (readonly string[])[];
    holding: readonly string[];
    pair: readonly string[];
    summaries: readonly string[];
    pointsLabel: string;
    lineNotice: string;
    portfolioLine: string;
    latestLine: string;
    portfolioLegend: string;
    latestLegend: string;
    verticalNotice: string;
    lineTitle: string;
    mapPoints: Record<"portfolio" | "bbca" | "market", MapPointText>;
    formula: string;
    riskFreePoint: readonly string[];
    marketPoint: readonly string[];
    portfolioPoint: readonly string[];
    bbcaPoint: readonly string[];
    ammnElsewhere: string;
    unmeasured: string;
    stocksNotice: string;
    stocks: readonly (readonly [string, ...string[]])[];
    noHoldings: string;
    itmgFailure: string;
    stockTitle: string;
    allMeasuresLink: string;
    stockHeadings: readonly string[];
    stockMeasures: string;
    aadiTitle: string;
    aadiFailure: string;
    admrFailure: string;
    notFoundTitle: string;
  }
> = {
  id: {
    classLink: "Imbal hasil dan risiko portofolio Anda dan setiap saham",
    title: `Imbal hasil dan risiko di ${className}`,
    backLink: `Kembali ke ${className}`,
    portfolioLink: "Lihat nilai dan imbal hasil portofolio Anda",
    ordersLink: "Pasang dan pantau order Anda",
    measuresLink:
      "Lihat imbal hasil dan risiko portofolio Anda dan setiap saham",
    methodNotice:
      "Ukuran ini adalah simulasi dari harga penutupan masa lalu. Setiap imbal hasil bulanan adalah perubahan harga penutupan final dari hari bursa terakhir suatu bulan ke hari bursa terakhir bulan berikutnya, tanpa dividen. Ukuran suatu saham atau portofolio memakai bulan-bulan di antara 60 bulan lengkap terakhir yang di dalamnya IHSG dan setiap sahamnya memiliki imbal hasil, dan memerlukan paling sedikit 24 imbal hasil bulanan. Setiap nilai berlaku per bulan.",
    headings: [
      "Ukuran portofolio Anda",
      "Bobot portofolio Anda",
      "Saham Anda pada bulan-bulan ini",
      "Kovarians dan korelasi saham Anda",
      "IHSG dan suku bunga bebas risiko",
      "Imbal hasil bulanan",
      "Garis pasar sekuritas",
      "Ukuran setiap saham",
    ],
    months:
      "Ukuran di bawah memakai 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    measures: [
      "Imbal hasil yang diharapkan",
      "-0,05%",
      "E(Rp) = Σ wi E(Ri) (SUMPRODUCT)",
      "Varians",
      "0,0006732",
      "σ²p = Σi Σj wi wj σij (MMULT)",
      "Simpangan baku",
      "2,59%",
      "σp = √σ²p = √0,0006732",
      "Beta terhadap IHSG",
      "0,34",
      "βp = Σ wi βi (SUMPRODUCT)",
      "Imbal hasil yang disyaratkan CAPM",
      "0,33%",
      "kp = Rf + βp(E(RM) − Rf) = 0,48% + 0,34 × (0,05% − 0,48%)",
      "Jarak dari garis pasar sekuritas",
      "▼ -0,38%",
      "αp = E(Rp) − kp = -0,05% − 0,33%",
    ].join(""),
    below:
      "Imbal hasil yang diharapkan berada di bawah garis pasar sekuritas, sehingga lebih rendah daripada imbal hasil yang disyaratkan CAPM untuk betanya.",
    weights: [
      ["BBCA", "Rp\u00a0498.000.000.000", "49,64%"],
      ["Kas", "Rp\u00a0505.259.000.000", "50,36%"],
      ["Total", "Rp\u00a01.003.259.000.000", "100,00%"],
    ],
    holding: ["BBCA", "49,64%", "-0,10%", "0,69"],
    pair: ["BBCA", "0,002732", "1,00"],
    summaries: ["Imbal hasil bulanan IHSG", "Imbal hasil bulanan BBCA"],
    pointsLabel: "Titik-titik grafik",
    lineNotice:
      "Garis ini melewati suku bunga bebas risiko pada beta 0 dan imbal hasil yang diharapkan IHSG pada beta 1, sehingga memberikan imbal hasil yang disyaratkan CAPM untuk setiap beta. Titik di atas garis memiliki imbal hasil yang diharapkan lebih tinggi daripada yang disyaratkan CAPM untuk betanya, dan titik di bawah garis memiliki imbal hasil yang diharapkan lebih rendah.",
    portfolioLine:
      "Grafik ini menempatkan portofolio Anda, saham Anda, dan setiap saham lain yang ukurannya memakai bulan-bulan yang sama dengan portofolio Anda terhadap garis pasar sekuritas bulan-bulan tersebut, yang memberikan 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    latestLine:
      "Portofolio Anda belum memiliki ukuran, sehingga grafik ini menempatkan setiap saham yang ukurannya memakai bulan-bulan lengkap terakhir IHSG terhadap garis pasar sekuritas bulan-bulan tersebut, yang memberikan 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    portfolioLegend: "Portofolio AndaSaham Anda, ukuran = bobotIHSGSML",
    latestLegend: "Saham lainIHSGSML",
    verticalNotice: "Tegak: imbal hasil yang diharapkan per bulan.",
    lineTitle: "Garis pasar sekuritas",
    mapPoints: {
      portfolio: mapPointText(
        "Portofolio Anda",
        [
          ["Beta terhadap IHSG", "", "0,34"],
          ["Imbal hasil yang diharapkan", "", "-0,05%"],
          ["Jarak dari garis pasar sekuritas", "▼ ", "-0,38%"],
        ],
        "dan",
      ),
      bbca: mapPointText(
        "BBCA",
        [
          ["Beta terhadap IHSG", "", "0,69"],
          ["Imbal hasil yang diharapkan", "", "-0,10%"],
          ["Jarak dari garis pasar sekuritas", "▼ ", "-0,28%"],
        ],
        "dan",
      ),
      market: mapPointText(
        "IHSG",
        [
          ["Beta terhadap IHSG", "", "1,00"],
          ["Imbal hasil yang diharapkan", "", "0,05%"],
          ["Jarak dari garis pasar sekuritas", "", "0,00%"],
        ],
        "dan",
      ),
    },
    formula: "k = Rf + β(E(RM) − Rf) = 0,48% + β × (0,05% − 0,48%)",
    riskFreePoint: ["Suku bunga bebas risiko (Rf)", "0,00", "0,48%", "0,00%"],
    marketPoint: ["IHSG (M)", "1,00", "0,05%", "0,00%"],
    portfolioPoint: ["Portofolio Anda (p)", "0,34", "-0,05%", "▼ -0,38%"],
    bbcaPoint: ["BBCA", "0,69", "-0,10%", "▼ -0,28%"],
    ammnElsewhere:
      "AMMN tidak ada di grafik, karena ukurannya memakai bulan-bulan yang berbeda, yang memberikan garis pasar sekuritas yang berbeda. Halamannya menunjukkan jaraknya dari garis itu.",
    unmeasured:
      "Saham yang belum memiliki ukuran tidak ada di grafik, dan tabel ukuran setiap saham di bawah menjelaskan alasannya.",
    stocksNotice:
      "Tabel ini memuat setiap saham LQ45 yang dicatat Portolab, sehingga mencakup setiap saham yang dapat Anda beli atau jual. Setiap saham memakai bulan-bulan yang di dalamnya saham itu dan IHSG memiliki imbal hasil, dan halamannya menunjukkan setiap rumus dan setiap imbal hasil, atau alasan lengkap mengapa saham itu belum memiliki ukuran.",
    stocks: [
      ["AADI", "21 dari 24 imbal hasil bulanan yang dibutuhkan ukuran"],
      ["ADMR", "0 dari 24 imbal hasil bulanan yang dibutuhkan ukuran"],
      ["BBCA", "-0,10%", "5,23%", "0,69"],
    ],
    noHoldings:
      "Anda belum memegang saham, sehingga portofolio Anda hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio Anda setelah order beli Anda tereksekusi.",
    itmgFailure:
      "Saham Anda dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, dan ITMG memiliki imbal hasil paling sedikit, sedangkan Portolab menghitung ukuran portofolio hanya dari paling sedikit 24 imbal hasil bulanan. Jika IHSG dan setiap saham Anda tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran portofolio Anda setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama November 2028.",
    stockTitle: "Imbal hasil dan risiko BBCA",
    allMeasuresLink: `Kembali ke imbal hasil dan risiko di ${className}`,
    stockHeadings: ["IHSG dan suku bunga bebas risiko", "Imbal hasil bulanan"],
    stockMeasures: [
      "Imbal hasil yang diharapkan",
      "-0,10%",
      "E(Ri) = ΣRi / n, n = 60 (AVERAGE)",
      "Varians",
      "0,002732",
      "σ²i = Σ(Ri − E(Ri))² / (n − 1) (VAR.S)",
      "Simpangan baku",
      "5,23%",
      "σi = √σ²i = √0,002732 (STDEV.S)",
      "Kovarians dengan IHSG",
      "0,001413",
      "σiM = Σ(Ri − E(Ri))(RM − E(RM)) / (n − 1) (COVARIANCE.S)",
      "Korelasi dengan IHSG",
      "0,60",
      "ρiM = σiM / (σi σM) = 0,001413 / (5,23% × 4,53%) (CORREL)",
      "Beta terhadap IHSG",
      "0,69",
      "βi = σiM / σ²M = 0,001413 / 0,002049 (SLOPE)",
      "Imbal hasil yang disyaratkan CAPM",
      "0,18%",
      "ki = Rf + βi(E(RM) − Rf) = 0,48% + 0,69 × (0,05% − 0,48%)",
      "Jarak dari garis pasar sekuritas",
      "▼ -0,28%",
      "αi = E(Ri) − ki = -0,10% − 0,18%",
    ].join(""),
    aadiTitle: "Imbal hasil dan risiko AADI",
    aadiFailure:
      "AADI dan IHSG baru sama-sama memiliki 21 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung ukuran suatu saham hanya dari paling sedikit 24 imbal hasil bulanan. Jika AADI dan IHSG tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran AADI setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Januari 2027.",
    admrFailure:
      "ADMR dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung ukuran suatu saham hanya dari paling sedikit 24 imbal hasil bulanan. Portolab belum menyimpan riwayat harga ADMR selama satu bulan penuh, sehingga belum dapat memperkirakan kapan ukurannya tersedia. Portolab dapat memperkirakannya setelah pembaruan riwayat harga berikutnya menyimpan riwayat tersebut.",
    notFoundTitle: "Halaman tidak ditemukan",
  },
  en: {
    classLink: "Return and risk of your portfolio and of each stock",
    title: `Return and risk in ${className}`,
    backLink: `Back to ${className}`,
    portfolioLink: "See the value and the return of your portfolio",
    ordersLink: "Place and follow your orders",
    measuresLink:
      "See the return and the risk of your portfolio and of each stock",
    methodNotice:
      "These measures are a simulation from past closes. Each monthly return is the change of the final close from the last trading day of one month to the last trading day of the next, without dividends. The measures of a stock or of a portfolio use the months, among the latest 60 complete months, in which the IHSG and each of its stocks have a return, and they need at least 24 monthly returns. Every value is per month.",
    headings: [
      "Measures of your portfolio",
      "Weights of your portfolio",
      "Your stocks in these months",
      "Covariances and correlations of your stocks",
      "The IHSG and the risk-free rate",
      "Monthly returns",
      "Security market line",
      "Measures of each stock",
    ],
    months:
      "The measures below use 60 monthly returns from October 2021 to September 2026.",
    measures: [
      "Expected return",
      "-0.05%",
      "E(Rp) = Σ wi E(Ri) (SUMPRODUCT)",
      "Variance",
      "0.0006732",
      "σ²p = Σi Σj wi wj σij (MMULT)",
      "Standard deviation",
      "2.59%",
      "σp = √σ²p = √0.0006732",
      "Beta against the IHSG",
      "0.34",
      "βp = Σ wi βi (SUMPRODUCT)",
      "Return that CAPM requires",
      "0.33%",
      "kp = Rf + βp(E(RM) − Rf) = 0.48% + 0.34 × (0.05% − 0.48%)",
      "Distance from the security market line",
      "▼ -0.38%",
      "αp = E(Rp) − kp = -0.05% − 0.33%",
    ].join(""),
    below:
      "The expected return lies below the security market line, so it is lower than the return that CAPM requires for its beta.",
    weights: [
      ["BBCA", "IDR\u00a0498,000,000,000", "49.64%"],
      ["Cash", "IDR\u00a0505,259,000,000", "50.36%"],
      ["Total", "IDR\u00a01,003,259,000,000", "100.00%"],
    ],
    holding: ["BBCA", "49.64%", "-0.10%", "0.69"],
    pair: ["BBCA", "0.002732", "1.00"],
    summaries: ["Monthly returns of the IHSG", "Monthly returns of BBCA"],
    pointsLabel: "The points of the chart",
    lineNotice:
      "The line runs through the risk-free rate at a beta of 0 and the expected return of the IHSG at a beta of 1, so it gives the return that CAPM requires for each beta. A point above the line has a higher expected return than CAPM requires for its beta, and a point below it has a lower one.",
    portfolioLine:
      "The chart places your portfolio, your stocks, and every other stock whose measures use the same months as your portfolio against the security market line of those months, which give 60 monthly returns from October 2021 to September 2026.",
    latestLine:
      "Your portfolio has no measures yet, so the chart places every stock whose measures use the latest complete months of the IHSG against the security market line of those months, which give 60 monthly returns from October 2021 to September 2026.",
    portfolioLegend: "Your portfolioYour stocks, size = weightIHSGSML",
    latestLegend: "Other stocksIHSGSML",
    verticalNotice: "Vertical: the expected return per month.",
    lineTitle: "Security market line",
    mapPoints: {
      portfolio: mapPointText(
        "Your portfolio",
        [
          ["Beta against the IHSG", "", "0.34"],
          ["Expected return", "", "-0.05%"],
          ["Distance from the security market line", "▼ ", "-0.38%"],
        ],
        "and",
      ),
      bbca: mapPointText(
        "BBCA",
        [
          ["Beta against the IHSG", "", "0.69"],
          ["Expected return", "", "-0.10%"],
          ["Distance from the security market line", "▼ ", "-0.28%"],
        ],
        "and",
      ),
      market: mapPointText(
        "IHSG",
        [
          ["Beta against the IHSG", "", "1.00"],
          ["Expected return", "", "0.05%"],
          ["Distance from the security market line", "", "0.00%"],
        ],
        "and",
      ),
    },
    formula: "k = Rf + β(E(RM) − Rf) = 0.48% + β × (0.05% − 0.48%)",
    riskFreePoint: ["Risk-free rate (Rf)", "0.00", "0.48%", "0.00%"],
    marketPoint: ["IHSG (M)", "1.00", "0.05%", "0.00%"],
    portfolioPoint: ["Your portfolio (p)", "0.34", "-0.05%", "▼ -0.38%"],
    bbcaPoint: ["BBCA", "0.69", "-0.10%", "▼ -0.28%"],
    ammnElsewhere:
      "AMMN is not on the chart, because its measures use different months, which give a different security market line. Its page shows its distance from that line.",
    unmeasured:
      "A stock that has no measures yet is not on the chart, and the table of the measures of each stock below says why.",
    stocksNotice:
      "The table lists every stock of the LQ45 that Portolab records, so it covers every stock that you can buy or sell. Each stock uses the months in which it and the IHSG have a return, and its page shows every formula and every return, or the whole reason why it has no measures yet.",
    stocks: [
      ["AADI", "21 of the 24 monthly returns that the measures need"],
      ["ADMR", "0 of the 24 monthly returns that the measures need"],
      ["BBCA", "-0.10%", "5.23%", "0.69"],
    ],
    noHoldings:
      "You hold no shares yet, so your portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of your portfolio once a purchase of yours fills.",
    itmgFailure:
      "Your stocks and the IHSG share 0 monthly returns in the latest 60 complete months, and ITMG has the fewest returns, but Portolab computes the measures of a portfolio only from at least 24 monthly returns. If the IHSG and each of your stocks keep a close at the end of every month, Portolab computes the measures of your portfolio after the update of the price history that stores the close of the first trading day of November 2028.",
    stockTitle: "Return and risk of BBCA",
    allMeasuresLink: `Back to return and risk in ${className}`,
    stockHeadings: ["The IHSG and the risk-free rate", "Monthly returns"],
    stockMeasures: [
      "Expected return",
      "-0.10%",
      "E(Ri) = ΣRi / n, n = 60 (AVERAGE)",
      "Variance",
      "0.002732",
      "σ²i = Σ(Ri − E(Ri))² / (n − 1) (VAR.S)",
      "Standard deviation",
      "5.23%",
      "σi = √σ²i = √0.002732 (STDEV.S)",
      "Covariance with the IHSG",
      "0.001413",
      "σiM = Σ(Ri − E(Ri))(RM − E(RM)) / (n − 1) (COVARIANCE.S)",
      "Correlation with the IHSG",
      "0.60",
      "ρiM = σiM / (σi σM) = 0.001413 / (5.23% × 4.53%) (CORREL)",
      "Beta against the IHSG",
      "0.69",
      "βi = σiM / σ²M = 0.001413 / 0.002049 (SLOPE)",
      "Return that CAPM requires",
      "0.18%",
      "ki = Rf + βi(E(RM) − Rf) = 0.48% + 0.69 × (0.05% − 0.48%)",
      "Distance from the security market line",
      "▼ -0.28%",
      "αi = E(Ri) − ki = -0.10% − 0.18%",
    ].join(""),
    aadiTitle: "Return and risk of AADI",
    aadiFailure:
      "AADI and the IHSG share 21 monthly returns in the latest 60 complete months, but Portolab computes the measures of a stock only from at least 24 monthly returns. If AADI and the IHSG keep a close at the end of every month, Portolab computes the measures of AADI after the update of the price history that stores the close of the first trading day of January 2027.",
    admrFailure:
      "ADMR and the IHSG share 0 monthly returns in the latest 60 complete months, but Portolab computes the measures of a stock only from at least 24 monthly returns. Portolab has not stored a complete month of the price history of ADMR yet, so it cannot tell when the measures come. It can tell once the next update of the price history stores that history.",
    notFoundTitle: "Page not found",
  },
};

/** Creates a lecturer with a class and a student who joined it, lets a test give the student a portfolio, or none, and opens the measures from the page of the class. */
async function openMeasures(
  page: Page,
  browser: Browser,
  portfolio: PortfolioOfTest,
): Promise<{ student: Page; main: Locator; classPath: string }> {
  const { student, classPath } = await studentWithPortfolio(
    page,
    browser,
    portfolio,
  );
  await student
    .getByRole("link", { name: texts[portfolio.locale].classLink })
    .click();
  await expect(student).toHaveURL(`${classPath}/measures`);
  return { student, main: student.getByRole("main"), classPath };
}

/** Checks the cells of a row of a table, each a header or a data cell. */
async function expectRow(
  row: Locator,
  cells: readonly string[],
): Promise<void> {
  await expect(row.locator("th, td")).toHaveText(cells);
}

/** Opens every table of monthly returns and of the points of the chart, so that a check sees the screen with its widest content. */
async function openReturnTables(page: Page): Promise<void> {
  for (const summary of await page.getByRole("main").locator("summary").all()) {
    await summary.click();
  }
}

/** Checks the section of the security market line: what the map places against which line, its legend, the formula of the line, each point in the table of the points, and which stocks are not on the map. Once JavaScript runs, the map is a slider that reads its resting point, and the browser places the names of the points apart from each other. */
async function expectMarketLine(
  main: Locator,
  section: {
    locale: Locale;
    notice: string;
    legend: string;
    points: readonly (readonly string[])[];
    resting: MapPointText;
  },
): Promise<void> {
  const text = texts[section.locale];
  for (const notice of [
    section.notice,
    text.lineNotice,
    text.verticalNotice,
    text.formula,
    text.ammnElsewhere,
    text.unmeasured,
  ]) {
    await expect(main).toContainText(notice);
  }
  // The legend names the marks of the map, which screen readers skip, as they skip the drawing.
  await expect(main.locator("ul")).toHaveText(section.legend);
  const rows = main
    .locator("details")
    .filter({ hasText: text.pointsLabel })
    .locator("tbody tr");
  await expect(rows).toHaveCount(section.points.length);
  for (const [index, cells] of section.points.entries()) {
    await expectRow(rows.nth(index), cells);
  }
  const map = riskMap(main, section.locale);
  await expect(map).toHaveAttribute("aria-valuetext", section.resting.spoken);
  await expectNamesApart(map);
}

// A phone answers a finger and a desktop a pointer.
function isPhone(): boolean {
  return test.info().project.name === "phone";
}

/** The map of the security market line, which is a slider named by the heading of its section once JavaScript runs. */
function riskMap(main: Locator, locale: Locale): Locator {
  return main.getByRole("slider", { name: texts[locale].lineTitle });
}

/** Checks that no two names or labels of the map overlap, as the browser measures them once the fonts load. The marks of the axes are in the font of codes and stand outside the plot, apart from the names. */
async function expectNamesApart(map: Locator): Promise<void> {
  await expect
    .poll(() =>
      map.evaluate(async (element) => {
        await document.fonts.ready;
        const boxes = Array.from(element.querySelectorAll("text"))
          .filter(
            (label) =>
              label.getAttribute("visibility") !== "hidden" &&
              !getComputedStyle(label).fontFamily.includes("DM Mono"),
          )
          .map((label) => ({
            name: label.textContent,
            box: label.getBoundingClientRect(),
          }));
        const overlaps: string[] = [];
        for (const [index, first] of boxes.entries()) {
          for (const second of boxes.slice(index + 1)) {
            if (
              first.box.left < second.box.right &&
              second.box.left < first.box.right &&
              first.box.top < second.box.bottom &&
              second.box.top < first.box.bottom
            ) {
              overlaps.push(`${first.name} and ${second.name}`);
            }
          }
        }
        return overlaps;
      }),
    )
    .toEqual([]);
}

/** Where the mark of a point lies on the screen, from the position of the plot at which the map places its name. */
async function markPosition(
  map: Locator,
  name: string,
): Promise<{ x: number; y: number }> {
  const label = map
    .locator("text")
    .filter({ hasText: new RegExp(`^${name}$`) });
  const area = await map.locator("svg").first().boundingBox();
  const across = await label.getAttribute("x");
  const down = await label.getAttribute("y");
  if (area === null || across === null || down === null) {
    throw new Error(`The map does not name ${name}.`);
  }
  return {
    x: area.x + (Number.parseFloat(across) / 100) * area.width,
    y: area.y + (Number.parseFloat(down) / 100) * area.height,
  };
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`shows the measures of a portfolio with every formula and input, places it and its stocks against the security market line, and shows the measures of each stock, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, main, classPath } = await openMeasures(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestHolding(classId, bbcaHolding);
      },
    });
    await expectPageHeadings(student, {
      title: text.title,
      headings: text.headings,
    });
    for (const [name, path] of [
      [text.backLink, classPath],
      [text.portfolioLink, `${classPath}/portfolio`],
      [text.ordersLink, `${classPath}/orders`],
    ] as const) {
      await expect(main.getByRole("link", { name })).toHaveAttribute(
        "href",
        path,
      );
    }
    await expectTexts(main, [text.methodNotice, text.months, text.below]);
    await expect(main.locator("dl").first()).toHaveText(text.measures);
    const tables = main.locator("table");
    const weightRows = tables.nth(0).locator("tbody tr");
    await expect(weightRows).toHaveCount(text.weights.length);
    for (const [index, cells] of text.weights.entries()) {
      await expectRow(weightRows.nth(index), cells);
    }
    await expectRow(tables.nth(1).locator("tbody tr"), text.holding);
    await expectRow(tables.nth(2).locator("tbody tr"), text.pair);
    await expect(main.locator("summary")).toHaveText([
      ...text.summaries,
      text.pointsLabel,
    ]);
    await openReturnTables(student);
    await expectMarketLine(main, {
      locale,
      notice: text.portfolioLine,
      legend: text.portfolioLegend,
      points: [
        text.riskFreePoint,
        text.marketPoint,
        text.portfolioPoint,
        text.bbcaPoint,
      ],
      resting: text.mapPoints.portfolio,
    });
    // 60 returns and the close that starts the first of them.
    await expect(tables.nth(4).locator("tbody tr")).toHaveCount(61);
    await expect(main).toContainText(text.stocksNotice);
    const stockTable = tables.last();
    for (const cells of text.stocks) {
      const [code] = cells;
      await expectRow(
        stockTable.locator("tbody tr").filter({
          has: student.getByRole("link", { name: code, exact: true }),
        }),
        cells,
      );
    }
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test(`shows each measure of a stock with its formula and its inputs, and why a stock has none, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, main, classPath } = await openMeasures(page, browser, {
      locale,
    });
    await main.getByRole("link", { name: "BBCA", exact: true }).click();
    await expect(student).toHaveURL(`${classPath}/measures/BBCA`);
    await expectPageHeadings(student, {
      title: text.stockTitle,
      headings: text.stockHeadings,
    });
    await expect(main).toContainText(text.methodNotice);
    await expect(main.locator("dl").first()).toHaveText(text.stockMeasures);
    await openReturnTables(student);
    await expectAccessibleScreen(student);
    await main.getByRole("link", { name: text.allMeasuresLink }).click();
    await expect(student).toHaveURL(`${classPath}/measures`);
    await main.getByRole("link", { name: "AADI", exact: true }).click();
    await expectPageHeadings(student, { title: text.aadiTitle, headings: [] });
    await expect(main).toContainText(text.aadiFailure);
    await expectAccessibleScreen(student);
    await student.goto(`${classPath}/measures/ADMR`);
    await expect(main).toContainText(text.admrFailure);
    await student.context().close();
  });

  test(`reads the points of the map in the order of their risk with the keys, and with a pointer on a desktop or a finger on a phone, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, main } = await openMeasures(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestHolding(classId, bbcaHolding);
      },
    });
    const map = riskMap(main, locale);
    const points = text.mapPoints;
    // The tooltip is the only part of the map with paragraphs: the name of the point and a line for each of its values.
    const tip = map.locator("p");
    // Until a reader marks a point, the slider reads the portfolio, and no tooltip covers the map.
    await expect(map).toHaveAttribute(
      "aria-valuetext",
      points.portfolio.spoken,
    );
    await expect(tip).toHaveCount(0);
    await map.focus();
    await expect(tip).toHaveText(points.portfolio.tip);
    await expectAccessibleScreen(student);
    // The portfolio has the smallest beta, BBCA the next, and the IHSG the largest.
    for (const [key, point] of [
      ["End", points.market],
      ["Home", points.portfolio],
      ["ArrowRight", points.bbca],
      ["ArrowRight", points.market],
      ["ArrowRight", points.market],
      ["ArrowLeft", points.bbca],
    ] as const) {
      await student.keyboard.press(key);
      await expect(map).toHaveAttribute("aria-valuetext", point.spoken);
      await expect(tip).toHaveText(point.tip);
    }
    await student.keyboard.press("Escape");
    await expect(tip).toHaveCount(0);
    const bbca = await markPosition(map, "BBCA");
    if (isPhone()) {
      await student.touchscreen.tap(bbca.x, bbca.y);
      await expect(tip).toHaveText(points.bbca.tip);
    } else {
      await student.mouse.move(bbca.x, bbca.y);
      await expect(tip).toHaveText(points.bbca.tip);
      // A pointer away from every point marks none.
      const area = await map.boundingBox();
      if (area === null) {
        throw new Error("The map draws nothing.");
      }
      await student.mouse.move(area.x + area.width / 2, area.y - 20);
      await expect(tip).toHaveCount(0);
    }
    await student.context().close();
  });

  test(`says why a portfolio has no measures, places every stock against the line of the latest months instead, and leads from the portfolio to the measures, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, main, classPath } = await openMeasures(page, browser, {
      locale,
    });
    await expect(main).toContainText(text.noHoldings);
    await openReturnTables(student);
    await expectMarketLine(main, {
      locale,
      notice: text.latestLine,
      legend: text.latestLegend,
      points: [text.riskFreePoint, text.marketPoint, text.bbcaPoint],
      resting: text.mapPoints.market,
    });
    await expectAccessibleScreen(student);
    await student.goto(`${classPath}/portfolio`);
    await main.getByRole("link", { name: text.measuresLink }).click();
    await expect(student).toHaveURL(`${classPath}/measures`);
    await student.context().close();
  });

  test(`explains when a portfolio of a stock with too few monthly returns gets its measures, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, main } = await openMeasures(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestPurchases(classId, itmgPortfolio);
      },
    });
    await expect(main).toContainText(text.itmgFailure);
    await student.context().close();
  });

  test(`answers a lecturer, a student who is not in the class, and a stock that Portolab does not track at the addresses of the measures as addresses that do not exist, in ${language}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.notFoundTitle,
      addresses: ({ classPath }) => [
        { reader: "lecturer", path: `${classPath}/measures` },
        { reader: "lecturer", path: `${classPath}/measures/BBCA` },
        { reader: "student", path: "/classes/999999999/measures" },
        { reader: "student", path: "/classes/999999999/measures/BBCA" },
        { reader: "student", path: `${classPath}/measures/BREN` },
      ],
    });
  });

  test.describe(`before JavaScript loads in ${language}`, () => {
    test.use({ javaScriptEnabled: false });

    test("draws the map with the name of each point and the table of its points, without a slider that needs JavaScript", async ({
      page,
      browser,
    }) => {
      const { lecturer } = await openAsNewStudent(page, browser, {
        locale,
        givePortfolio: (classId) => {
          storeTestHolding(classId, bbcaHolding);
        },
        path: "/measures",
      });
      const main = page.getByRole("main");
      await expect(page.getByRole("slider")).toHaveCount(0);
      for (const point of [text.mapPoints.portfolio, text.mapPoints.bbca]) {
        await expect(
          main
            .locator("svg text")
            .filter({ hasText: new RegExp(`^${point.name}$`) }),
        ).toHaveCount(1);
      }
      await main.getByText(text.pointsLabel, { exact: true }).click();
      const rows = main
        .locator("details")
        .filter({ hasText: text.pointsLabel })
        .locator("tbody tr");
      const points = [
        text.riskFreePoint,
        text.marketPoint,
        text.portfolioPoint,
        text.bbcaPoint,
      ];
      await expect(rows).toHaveCount(points.length);
      for (const [index, cells] of points.entries()) {
        await expectRow(rows.nth(index), cells);
      }
      await lecturer.context().close();
    });
  });
}
