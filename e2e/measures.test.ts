import { expectMapLabelsClear } from "./expect-map-labels-clear.ts";
import { fieldMaximumLength } from "../app/form-size.ts";
import { screenshotFullHeight } from "./screenshot-full-height.ts";
import { captureScreens } from "./capture-screens.ts";
import type { Browser, Locator, Page, TestInfo } from "@playwright/test";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { expect, test } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { locales } from "../app/paraglide/runtime.js";
import { languageNames } from "../app/language-names.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import { bbcaPortfolioMeasures } from "./bbca-portfolio-measures.ts";
import { expectMeasureList } from "./expect-measure-list.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { openAsNewStudent } from "./open-as-new-student.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { eq } from "drizzle-orm";
import { classes } from "../app/features/classes/classes.schema.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";
import { expectLayout, layoutProblems } from "./expect-layout.ts";
import { isPhone } from "./frame.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { storeTestJoiningTime } from "./store-test-joining-time.ts";
import { expectStockRangeReturn } from "./expect-stock-range-return.ts";

// Python Decimal computes the market comparisons from the recorded IHSG mean and variance in measure-stock.test.ts: standard deviation 0.04526752234036668, Sharpe -0.09576017242608941, and Treynor -0.004334825744615368. bbca-portfolio-measures.ts records the independent portfolio expectations.
const analysisText: Record<
  Locale,
  {
    stocksTitle: string;
    title: string;
    endValue: string;
    sessionLines: string;
    mapLesson: string;
    meaning: string;
    prices: string;
    period: string;
    measures: string;
    map: string;
    riskMap: string;
    axis: string;
    risk: string;
    data: string;
    method: string;
    calculate: string;
    pointCalculation: (name: string) => string;
    portfolioPoint: string;
    stockPoint: string;
    stockSpoken: string;
    insufficient: string;
    marketLink: string;
    rows: readonly (readonly [string, string, string])[];
    legends: readonly string[];
    betaAxis: string;
    riskAxis: string;
    without: string;
    insight: string;
    riskInsight: string;
    learn: string;
    average: string;
    performance: string;
    noHoldings: string;
    returns: string;
    performanceHelp: string;
    performanceMeaning: string;
    performanceData: string;
    axisFailure: string;
    longAxisFailure: string;
    axisHints: readonly string[];
    apply: string;
    stockRange: string;
    month: string;
    backToAnalysis: string;
  }
> = {
  id: {
    stocksTitle: "Ukuran setiap saham",
    stockRange: "Rentang grafik harga",
    month: "1B",
    backToAnalysis: "Kembali ke Analisis",
    title: "Analisis",
    endValue: "Anda +0,11%",
    sessionLines: "Garis tegak: awal setiap sesi kuliah.",
    mapLesson: "Teori portofolio",
    meaning:
      "Diversifikasi menggabungkan saham yang imbal hasilnya tidak bergerak persis bersama, sehingga risiko portofolio dapat lebih kecil daripada rata-rata tertimbang risiko saham.",
    prices: "Waktu harga: Beranda",
    period:
      "60 imbal hasil bulanan, Oktober 2021 sampai September 2026. Semua ukuran per bulan. Rf 0,479% per bulan dari BI-Rate 5,75%.",
    measures: "Ukuran portofolio Anda",
    map: "Garis pasar sekuritas",
    riskMap: "Risiko total dan imbal hasil",
    axis: "Sumbu risiko",
    risk: "Simpangan baku",
    data: "Data dan metode",
    method:
      "Ukuran ini adalah simulasi dari harga penutupan masa lalu. Setiap imbal hasil bulanan adalah perubahan harga penutupan final dari hari bursa terakhir suatu bulan ke hari bursa terakhir bulan berikutnya, tanpa dividen. Ukuran suatu saham atau portofolio memakai bulan-bulan di antara 60 bulan lengkap terakhir yang di dalamnya IHSG dan setiap sahamnya memiliki imbal hasil, dan memerlukan paling sedikit 24 imbal hasil bulanan. Setiap nilai berlaku per bulan.",
    calculate: "Lihat perhitungan",
    pointCalculation: (name) => `Lihat perhitungan ${name}`,
    portfolioPoint: "Lihat perhitungan Portofolio Anda",
    stockPoint: "Lihat perhitungan BBCA",
    stockSpoken:
      "BBCA: Beta 0,69, Imbal hasil harapan -0,10%, dan Alpha Jensen -0,28%",
    insufficient:
      "Saham Anda dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, dan ITMG memiliki imbal hasil paling sedikit, sedangkan Portolab menghitung ukuran portofolio hanya dari paling sedikit 24 imbal hasil bulanan. Jika IHSG dan setiap saham Anda tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran portofolio Anda setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama November 2028.",
    marketLink: "Buka Pasar",
    rows: [
      ["Imbal hasil harapan", "-0,05%", "IHSG 0,05%."],
      ["Simpangan baku", "2,59%", "IHSG 4,53%."],
      ["Beta", "0,34", "IHSG 1,00."],
      ["Rasio Sharpe", "-0,20", "IHSG -0,10."],
      ["Rasio Treynor", "-1,55%", "IHSG -0,43%."],
      ["Alpha Jensen", "▼ -0,38%", "IHSG 0,00% menurut definisi."],
    ],
    legends: [
      "Portofolio Anda",
      "Saham Anda, ukuran = bobot",
      "SML",
      "alpha positif",
      "alpha negatif",
      "IHSG",
    ],
    betaAxis: "Beta (1,0 = pasar)",
    riskAxis: "Risiko per bulan (simpangan baku)",
    without: "Tanpa diversifikasi",
    insight: "Sesi 9 · CAPM",
    riskInsight: "Sesi 2 · Diversifikasi",
    learn: "Pelajari",
    average:
      "Risiko tanpa diversifikasi adalah jumlah simpangan baku setiap saham dikalikan bobotnya. Kas tidak menambah risiko.",
    performance: "Kinerja vs IHSG",
    noHoldings:
      "Anda tidak memegang saham, sehingga portofolio Anda hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio Anda setelah order beli Anda tereksekusi.",
    returns: "Imbal hasil bulanan IHSG",
    performanceHelp: "Apa itu Kinerja vs IHSG?",
    performanceMeaning:
      "Grafik dan tabel membandingkan portofolio Anda dengan IHSG sejak penutupan 26 Oktober 2026, sebelum Anda dapat bertransaksi. Hari sebelumnya memakai harga penutupan final. Titik dengan waktu memakai nilai portofolio sekarang dan level tertunda terakhir IHSG.",
    performanceData: "Imbal hasil dari waktu ke waktu",
    axisFailure:
      'Kolom "Sumbu risiko" menerima "beta" atau "risk", tetapi isinya "BETA". Pilih salah satu sumbu risiko yang tercantum.',
    longAxisFailure:
      'Kolom "Sumbu risiko" berisi 8.000 karakter, tetapi hanya menerima "beta" atau "risk". Pilih salah satu sumbu risiko yang tercantum.',
    axisHints: ['Beta memakai "beta".', 'Simpangan baku memakai "risk".'],
    apply: "Tampilkan analisis",
  },
  en: {
    stocksTitle: "Measures of each stock",
    stockRange: "Price chart range",
    month: "1M",
    backToAnalysis: "Back to Analysis",
    title: "Analysis",
    endValue: "You +0.11%",
    sessionLines: "Vertical lines: the start of each class session.",
    mapLesson: "Portfolio theory",
    meaning:
      "Diversification combines stocks whose returns do not move exactly together, so portfolio risk can be lower than the weighted average stock risk.",
    prices: "Price times: Home",
    period:
      "60 monthly returns, October 2021 to September 2026. All measures are monthly. Rf 0.479% per month from BI-Rate 5.75%.",
    measures: "Your portfolio measures",
    map: "Security market line",
    riskMap: "Total risk and return",
    axis: "Risk axis",
    risk: "Standard deviation",
    data: "Data and method",
    method:
      "These measures are a simulation from past closes. Each monthly return is the change of the final close from the last trading day of one month to the last trading day of the next, without dividends. The measures of a stock or of a portfolio use the months, among the latest 60 complete months, in which the IHSG and each of its stocks have a return, and they need at least 24 monthly returns. Every value is per month.",
    calculate: "View calculation",
    pointCalculation: (name) => `See the calculation of ${name}`,
    portfolioPoint: "See the calculation of Your portfolio",
    stockPoint: "See the calculation of BBCA",
    stockSpoken:
      "BBCA: Beta 0.69, Expected return -0.10%, and Jensen's alpha -0.28%",
    insufficient:
      "Your stocks and the IHSG share 0 monthly returns in the latest 60 complete months, and ITMG has the fewest returns, but Portolab computes the measures of a portfolio only from at least 24 monthly returns. If the IHSG and each of your stocks keep a close at the end of every month, Portolab computes the measures of your portfolio after the update of the price history that stores the close of the first trading day of November 2028.",
    marketLink: "Open Market",
    rows: [
      ["Expected return", "-0.05%", "IHSG 0.05%."],
      ["Standard deviation", "2.59%", "IHSG 4.53%."],
      ["Beta", "0.34", "IHSG 1.00."],
      ["Sharpe ratio", "-0.20", "IHSG -0.10."],
      ["Treynor ratio", "-1.55%", "IHSG -0.43%."],
      ["Jensen's alpha", "▼ -0.38%", "IHSG 0.00% by definition."],
    ],
    legends: [
      "Your portfolio",
      "Your stocks, size = weight",
      "SML",
      "positive alpha",
      "negative alpha",
      "IHSG",
    ],
    betaAxis: "Beta (1.0 = market)",
    riskAxis: "Monthly risk (standard deviation)",
    without: "Without diversification",
    insight: "Session 9 · CAPM",
    riskInsight: "Session 2 · Diversification",
    learn: "Learn",
    average:
      "Risk without diversification is the sum of each stock standard deviation multiplied by its weight. Cash adds no risk.",
    performance: "Performance vs IHSG",
    noHoldings:
      "You hold no shares, so your portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of your portfolio once a purchase of yours fills.",
    returns: "Monthly returns of the IHSG",
    performanceHelp: "What is Performance vs IHSG?",
    performanceMeaning:
      "The chart and the table compare your portfolio with the IHSG since the close of October 26, 2026, before you could trade. Past days use final closes. A timestamped endpoint uses the current portfolio value and the latest delayed level of the IHSG.",
    performanceData: "Returns over time",
    axisFailure:
      'The field "Risk axis" takes "beta" or "risk", but it holds "BETA". Choose a listed risk axis.',
    longAxisFailure:
      'The field "Risk axis" has 8,000 characters, but it takes "beta" or "risk". Choose a listed risk axis.',
    axisHints: ['Beta uses "beta".', 'Standard deviation uses "risk".'],
    apply: "Show analysis",
  },
};

function giveBbcaPortfolio(classId: ClassId): void {
  storeTestHolding(classId, bbcaHolding);
  setAnalysisDates(classId);
}

function setAnalysisDates(classId: ClassId): void {
  writeForTestStudent(classId, (database, membershipId) => {
    database
      .update(classes)
      .set({ firstSessionDate: "2026-09-07" })
      .where(eq(classes.id, classId))
      .run();
    storeTestJoiningTime(
      database,
      membershipId,
      new Date("2026-10-26T10:00:00Z"),
    );
  });
}

function analysisStudent(page: Page, browser: Browser, locale: Locale) {
  return studentWithPortfolio(page, browser, {
    locale,
    givePortfolio: giveBbcaPortfolio,
  });
}

function openAnalysisOnPage(page: Page, browser: Browser, locale: Locale) {
  return openAsNewStudent(page, browser, {
    locale,
    path: "/analysis",
    givePortfolio: giveBbcaPortfolio,
  });
}

async function expectPerformanceHelp(
  page: Page,
  locale: Locale,
  checkOpenTable?: () => Promise<void>,
): Promise<void> {
  const text = analysisText[locale];
  await page
    .getByRole("button", { name: text.performanceHelp, exact: true })
    .click();
  const help = page.getByRole("dialog", {
    name: text.performance,
    exact: true,
  });
  await expect(help).toContainText(text.performanceMeaning);
  await help
    .getByRole("button", { name: text.performanceData, exact: true })
    .click();
  const data = page.getByRole("dialog", {
    name: text.performanceData,
    exact: true,
  });
  await expect(data.locator("tbody tr")).toHaveCount(5);
  expect(await layoutProblems(page)).toEqual([]);
  if (checkOpenTable !== undefined) await checkOpenTable();
  await page.keyboard.press("Escape");
  await expect(data).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
}

type InvalidAxisKind = "short" | "letters" | "digits";
const invalidAxes: Record<InvalidAxisKind, string> = {
  short: " BETA ",
  letters: "W".repeat(fieldMaximumLength),
  digits: "8".repeat(fieldMaximumLength),
};

async function openInvalidAnalysisAxis(
  page: Page,
  classPath: string,
  input: { locale: Locale; kind: InvalidAxisKind },
): Promise<Locator> {
  const text = analysisText[input.locale];
  const value = invalidAxes[input.kind];
  const response = await page.goto(
    `${classPath}/analysis?axis=${encodeURIComponent(value)}`,
  );
  expect(response?.status()).toBe(400);
  const field = page.getByRole("textbox", { name: text.axis, exact: true });
  await expect(field).toHaveValue(value);
  await expect(field).toHaveAccessibleDescription(
    input.kind === "short" ? text.axisFailure : text.longAxisFailure,
  );
  for (const hint of text.axisHints)
    await expect(page.getByText(hint, { exact: true })).toBeVisible();
  expect(await layoutProblems(page)).toEqual([]);
  return field;
}

async function correctAnalysisAxis(
  field: Locator,
  classPath: string,
  locale: Locale,
): Promise<void> {
  const page = field.page();
  const text = analysisText[locale];
  const title = page.getByRole("heading", { name: text.title, exact: true });
  const titleSize = await title.evaluate(
    (element) => getComputedStyle(element).fontSize,
  );
  await field.fill("risk");
  await page.getByRole("button", { name: text.apply, exact: true }).click();
  await expect(page).toHaveURL(`${classPath}/analysis?axis=risk`);
  await expect(title).toHaveCSS("font-size", titleSize);
  await expect(
    page.getByRole("region", { name: text.riskMap, exact: true }),
  ).toBeVisible();
}

async function openNativePointCalculation(
  page: Page,
  point: string,
  calculation: string,
): Promise<void> {
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expectMapLabelsClear(page.locator("svg:has([data-map-label])").first());
  await page.getByRole("button", { name: point, exact: true }).click();
  await expect(page.locator(`#${calculation}`)).toBeVisible();
}

for (const locale of locales) {
  const text = analysisText[locale];
  const language = languageNames[locale];
  test(`opens analysis with the map, six measures, and their calculations in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await analysisStudent(page, browser, locale);
    await student.goto(classPath);
    await student
      .getByRole("navigation")
      .getByRole("link", { name: text.title, exact: true })
      .click();
    await expect(student).toHaveURL(`${classPath}/analysis`);
    await expect(student).toHaveTitle(`${text.title} | Portolab`);
    const main = student.getByRole("main");
    await expect(main.locator("header")).toContainText(text.period);
    await expect(
      main.getByRole("link", { name: text.prices, exact: true }),
    ).toHaveAttribute("href", classPath);
    const measures = main.getByRole("region", {
      name: text.measures,
      exact: true,
    });
    const rows = measures.locator("dl > div");
    await expect(rows).toHaveCount(6);
    for (const [index, [label, value, reference]] of text.rows.entries()) {
      const row = rows.nth(index);
      await expect(row.locator("dt")).toContainText(label);
      await expect(row.locator(":scope > dd").first()).toHaveText(value);
      await expect(row.locator(":scope > dd").last()).toContainText(reference);
      await row
        .getByRole("button", { name: text.calculate, exact: true })
        .click();
      const calculation = student.getByRole("dialog", {
        name: label,
        exact: true,
      });
      await expect(calculation).toBeVisible();
      await expect(calculation.locator("strong").first()).toHaveText(value);
      await expect(
        calculation.getByRole("button", { name: text.data }),
      ).toBeVisible();
      await student.keyboard.press("Escape");
      await expect(calculation).toBeHidden();
    }
    const mapPanel = main.getByRole("region", { name: text.map, exact: true });
    await expect(mapPanel.locator("ul[aria-hidden] li")).toHaveText(
      text.legends,
    );
    await expect(
      mapPanel.locator("svg").getByText(text.betaAxis, { exact: true }),
    ).toBeVisible();
    await expectMapLabelsClear(mapPanel.locator("svg:has([data-map-label])"));
    await expect(mapPanel).toContainText(text.insight);
    await expect(
      mapPanel.getByRole("link", { name: text.learn, exact: true }),
    ).toBeVisible();
    const map = mapPanel.getByRole("slider");
    await map.focus();
    await student.keyboard.press("Enter");
    await expect(student.locator("#analysis-alpha")).toBeVisible();
    await student.keyboard.press("Escape");
    await expect(map).toBeFocused();
    await student.keyboard.press("Home");
    await student.keyboard.press("ArrowRight");
    await expect(map).toHaveAttribute("aria-valuetext", text.stockSpoken);
    await expect(map.locator("p").first()).toHaveText("BBCA");
    await student.keyboard.press("Escape");
    const stockPoint = mapPanel.getByRole("button", {
      name: text.stockPoint,
      exact: true,
    });
    if (isPhone()) {
      await stockPoint.tap();
    } else {
      await stockPoint.hover();
      await expect(map.locator("p").first()).toHaveText("BBCA");
      await stockPoint.click();
    }
    await expect(student.locator("#analysis-stock-BBCA-alpha")).toBeVisible();
    await student.keyboard.press("Escape");
    await mapPanel
      .getByRole("navigation", { name: text.axis })
      .getByRole("link", { name: text.risk, exact: true })
      .click();
    await expect(student).toHaveURL(`${classPath}/analysis?axis=risk`);
    const riskMap = main.getByRole("region", {
      name: text.riskMap,
      exact: true,
    });
    await expectMapLabelsClear(riskMap.locator("svg:has([data-map-label])"));
    await expect(riskMap).toContainText(text.riskInsight);
    await expect(
      riskMap.locator("svg").getByText(text.riskAxis, { exact: true }),
    ).toBeVisible();
    const ownPoint = riskMap.getByRole("button", {
      name: text.portfolioPoint,
      exact: true,
    });
    const ownBox = await ownPoint.boundingBox();
    expect(ownBox).not.toBeNull();
    expect(
      await riskMap
        .getByRole("button", {
          name: text.pointCalculation(text.without),
          exact: true,
        })
        .boundingBox(),
    ).toEqual(ownBox);
    await ownPoint.click();
    await expect(student.locator("#analysis-risk")).toBeVisible();
    await student.keyboard.press("Escape");
    await riskMap
      .getByRole("button", { name: text.stockPoint, exact: true })
      .click();
    await expect(student.locator("#analysis-stock-BBCA-risk")).toBeVisible();
    await student.keyboard.press("Escape");
    await riskMap.locator('button[popovertarget="analysis-map-help"]').click();
    await expect(student.locator("#analysis-map-help")).toContainText(
      text.meaning,
    );
    await student.keyboard.press("Escape");
    await riskMap.getByRole("link", { name: text.learn, exact: true }).click();
    await expect(
      student.getByRole("dialog", { name: text.mapLesson, exact: true }),
    ).toBeVisible();
    await student.keyboard.press("Escape");
    await expectPerformanceHelp(student, locale, async () => {
      await expectAccessibleScreen(student);
    });
    await student.context().close();
  });

  test(`explains an invalid axis and accepts its correction in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await analysisStudent(page, browser, locale);
    const field = await openInvalidAnalysisAxis(student, classPath, {
      locale,
      kind: "short",
    });
    await expectAccessibleScreen(student);
    await correctAnalysisAxis(field, classPath, locale);
    await student.context().close();
  });

  test(`keeps the widest refused axes inside the page in ${language}`, async ({
    page,
    browser,
  }, info) => {
    const { student, classPath } = await analysisStudent(page, browser, locale);
    for (const kind of ["letters", "digits"] as const) {
      const field = await openInvalidAnalysisAxis(student, classPath, {
        locale,
        kind,
      });
      await expectAccessibleScreen(student);
      await student.evaluate(async () => {
        await document.fonts.ready;
      });
      for (const width of isPhone() ? [360] : [1440, 1920]) {
        await student.setViewportSize({ width, height: 900 });
        for (const theme of ["light", "dark"] as const) {
          await student.emulateMedia({ colorScheme: theme });
          expect(await layoutProblems(student)).toEqual([]);
          await screenshotFullHeight(student, {
            scale: "css",
            path: info.outputPath(
              `analysis-axis-${locale}-${String(width)}-${kind}-${theme}.png`,
            ),
          });
        }
      }
      await correctAnalysisAxis(field, classPath, locale);
    }
    await student.context().close();
  });

  test(`keeps the method and return tables behind calculations in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await analysisStudent(page, browser, locale);
    await student.goto(`${classPath}/analysis`);
    await student
      .getByRole("region", { name: text.measures, exact: true })
      .getByRole("button", { name: text.calculate, exact: true })
      .first()
      .click();
    await student
      .locator("#analysis-expectedReturn")
      .getByRole("button", { name: text.data, exact: true })
      .click();
    const data = student.getByRole("dialog", { name: text.data, exact: true });
    await expect(data).toContainText(text.method);
    await expect(
      data.getByRole("heading", { name: text.stocksTitle, exact: true }),
    ).toBeVisible();
    await expectMeasureList(
      data.locator("dl").first(),
      bbcaPortfolioMeasures[locale],
    );
    await data
      .locator("summary:visible")
      .filter({ hasText: text.returns })
      .first()
      .click();
    await expect(
      data.locator("details[open] table tbody tr").first(),
    ).toBeVisible();
    expect(await layoutProblems(student)).toEqual([]);
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  for (const javaScriptEnabled of [true, false]) {
    test.describe(`stock returns with JavaScript ${String(javaScriptEnabled)} in ${language}`, () => {
      test.use({ javaScriptEnabled });
      for (const axis of ["beta", "risk"] as const) {
        test(`restores the stock row and the ${axis} axis after changing the stock chart range`, async ({
          page,
          browser,
        }, info) => {
          await expectAnalysisStockReturn(page, browser, {
            locale,
            axis,
            javaScriptEnabled,
            info,
          });
        });
      }
    });
  }

  test(`shows an empty portfolio with the IHSG map and a way to the market in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
    });
    await student.goto(`${classPath}/analysis`);
    await expect(student.getByRole("main")).toContainText(text.noHoldings);
    await expect(
      student.getByRole("link", { name: text.marketLink, exact: true }),
    ).toHaveAttribute("href", `${classPath}/market`);
    await expect(
      student.getByRole("main").getByRole("slider").first(),
    ).toBeVisible();
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test(`explains a holding without enough returns and draws the latest IHSG line in ${language}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openAsNewStudent(page, browser, {
      locale,
      path: "/analysis",
      givePortfolio: (classId) => {
        storeTestPurchases(classId, itmgPortfolio);
      },
    });
    const measures = page.getByRole("region", {
      name: text.measures,
      exact: true,
    });
    await expect(measures).toContainText(text.insufficient);
    await expect(measures.locator("dl")).toHaveCount(0);
    const map = page.getByRole("region", { name: text.map, exact: true });
    await expect(map.getByRole("slider")).toBeVisible();
    await expect(
      map.getByRole("button", { name: text.portfolioPoint }),
    ).toHaveCount(0);
    await expect(
      map.getByRole("button", { name: text.pointCalculation("ITMG") }),
    ).toHaveCount(0);
    await expectAccessibleScreen(page);
    await lecturer.context().close();
  });

  test(`rejects the old address and an analysis that the reader cannot see in ${language}`, async ({
    page,
    browser,
  }) => {
    const notFound: Record<Locale, string> = {
      id: "Halaman tidak ditemukan",
      en: "Page not found",
    };
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: notFound[locale],
      addresses: ({ classPath }) => [
        { reader: "lecturer", path: `${classPath}/analysis` },
        { reader: "student", path: "/classes/999999999/analysis" },
        { reader: "student", path: `${classPath}/measures` },
      ],
    });
  });

  test(`keeps a point calculation open when JavaScript loads in ${language}`, async ({
    page,
    browser,
  }) => {
    const { lecturer } = await openAnalysisOnPage(page, browser, locale);
    const scripts = Promise.withResolvers<undefined>();
    let held = 0;
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "script") {
        held += 1;
        await scripts.promise;
      }
      await route.continue();
    });
    try {
      await page.reload({ waitUntil: "commit" });
      await expect.poll(() => held).toBeGreaterThan(0);
      await openNativePointCalculation(
        page,
        text.portfolioPoint,
        "analysis-alpha",
      );
      scripts.resolve(undefined);
      await page.waitForLoadState("load");
      await expect(
        page.getByRole("main").getByRole("slider").first(),
      ).toBeVisible();
      await expect(page.locator("#analysis-alpha")).toBeVisible();
    } finally {
      scripts.resolve(undefined);
      await page.unrouteAll({ behavior: "wait" });
      await lecturer.context().close();
    }
  });

  test(`keeps the map and measure rows aligned at the reference widths in ${language}`, async ({
    page,
    browser,
  }, info) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (classId) => {
        // Python Decimal gives the costs from the closes of 29 October 2026 with the broker fee. It adds 265,760,290,000 + 498,000,000,000 + 164,340,000,000 + 73,000,000,000 = 1,001,100,290,000, a return of 0.00110029. Deleted fills leave the holdings and cash, so the current endpoint must use those surviving values.
        storeTestHolding(
          classId,
          { ...bbcaHolding, cash: rupiah(265_760_290_000) },
          [
            {
              code: "TLKM",
              shares: shares(83_000_000),
              cost: rupiah(164_586_510_000),
            },
            {
              code: "AMMN",
              shares: shares(20_000_000),
              cost: rupiah(74_912_200_000),
            },
          ],
        );
        setAnalysisDates(classId);
      },
    });
    const widths = info.project.name === "phone" ? [360] : [1440, 1920];
    for (const width of widths) {
      await student.setViewportSize({ width, height: 900 });
      for (const axis of ["beta", "risk"]) {
        await student.goto(`${classPath}/analysis?axis=${axis}`);
        const performance = student.getByRole("region", {
          name: text.performance,
          exact: true,
        });
        await expect(performance).toContainText(text.sessionLines);
        const endLabel = performance
          .locator("svg")
          .getByText(text.endValue, { exact: true });
        await expect(endLabel).toHaveCount(1);
        if (width === 360) await expect(endLabel).toBeHidden();
        else await expect(endLabel).toBeVisible();
        if (axis === "risk")
          await expect(
            student
              .getByRole("region", { name: text.riskMap, exact: true })
              .locator("svg")
              .getByText(text.without, { exact: true }),
          ).toBeVisible();
        if (axis === "risk") {
          const average = student
            .getByRole("region", { name: text.riskMap, exact: true })
            .getByRole("button", {
              name: text.pointCalculation(text.without),
              exact: true,
            });
          await average.focus();
          await student.keyboard.press("Enter");
          const calculation = student.getByRole("dialog", {
            name: text.without,
            exact: true,
          });
          await expect(calculation).toContainText(text.average);
          await expect(calculation).toContainText("σ̄ = Σ wi σi");
          await student.keyboard.press("Escape");
        }
        await student
          .getByRole("heading", { name: text.title, exact: true })
          .click();
        for (const colorScheme of ["light", "dark"] as const) {
          await student.setViewportSize({ width, height: 900 });
          await student.emulateMedia({ colorScheme });
          await student.evaluate(async () => {
            await document.fonts.ready;
          });
          await expectMapLabelsClear(
            student.locator("svg:has([data-map-label])").first(),
          );
          expect(await layoutProblems(student)).toEqual([]);
          const fullHeight = await student.evaluate(
            () => document.documentElement.scrollHeight,
          );
          await student.setViewportSize({ width, height: fullHeight });
          await student.screenshot({
            scale: "css",
            path: info.outputPath(
              `analysis-${locale}-${String(width)}-${axis}-${colorScheme}.png`,
            ),
            fullPage: false,
          });
        }
      }
    }
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test.describe(`before JavaScript loads in ${language}`, () => {
    test.use({ javaScriptEnabled: false });
    test("opens point calculations and changes the risk axis through native controls", async ({
      page,
      browser,
    }) => {
      const { lecturer, classPath } = await openAnalysisOnPage(
        page,
        browser,
        locale,
      );
      await expectPerformanceHelp(page, locale);
      await openNativePointCalculation(
        page,
        text.portfolioPoint,
        "analysis-alpha",
      );
      await page.keyboard.press("Escape");
      await page
        .getByRole("navigation", { name: text.axis })
        .getByRole("link", { name: text.risk, exact: true })
        .click();
      await expect(page).toHaveURL(/axis=risk$/);
      await openNativePointCalculation(
        page,
        text.portfolioPoint,
        "analysis-risk",
      );
      await page.keyboard.press("Escape");
      const field = await openInvalidAnalysisAxis(page, classPath, {
        locale,
        kind: "short",
      });
      await correctAnalysisAxis(field, classPath, locale);
      for (const kind of ["letters", "digits"] as const) {
        const widestField = await openInvalidAnalysisAxis(page, classPath, {
          locale,
          kind,
        });
        await correctAnalysisAxis(widestField, classPath, locale);
      }
      await lecturer.context().close();
    });
  });
}

async function expectAnalysisStockReturn(
  page: Page,
  browser: Browser,
  {
    locale,
    axis,
    javaScriptEnabled,
    info,
  }: {
    locale: Locale;
    axis: "beta" | "risk";
    javaScriptEnabled: boolean;
    info: TestInfo;
  },
): Promise<void> {
  const text = analysisText[locale];
  const { lecturer, classPath } = await openAnalysisOnPage(
    page,
    browser,
    locale,
  );
  try {
    const hints =
      javaScriptEnabled && axis === "risk"
        ? ["invalid", "9".repeat(fieldMaximumLength + 1)]
        : ["invalid"];
    for (const hint of hints) {
      const response = await page.goto(
        `${classPath}/analysis?${new URLSearchParams({ axis, data: hint }).toString()}`,
      );
      expect(response?.status()).toBe(200);
      await expect(page.locator("#analysis-data")).toBeHidden();
    }
    await page
      .getByRole("region", { name: text.measures, exact: true })
      .getByRole("button", { name: text.calculate, exact: true })
      .first()
      .click();
    await page
      .locator("#analysis-expectedReturn")
      .getByRole("button", { name: text.data, exact: true })
      .click();
    await expect(page.locator("#stock-BBCA")).toBeVisible();
    await page.locator("#stock-BBCA").click();
    const returnPath = `${classPath}/analysis?axis=${axis}&data=stocks#stock-BBCA`;
    await expectStockRangeReturn(page, {
      returnTo: returnPath,
      range: text.stockRange,
      month: text.month,
      back: text.backToAnalysis,
    });
    expect(await layoutProblems(page)).toEqual([]);
    if (javaScriptEnabled) await expectAccessibleScreen(page);
    if (javaScriptEnabled && axis === "risk")
      await captureScreens(page, info, {
        name: `analysis-stock-return-${locale}`,
        fullPage: true,
        fromTop: true,
        check: () => expectLayout(page),
      });
  } finally {
    await lecturer.context().close();
  }
}
