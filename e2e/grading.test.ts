import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { nameMaximumLength } from "../app/features/accounts/account-limits.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { readZipForTest } from "../app/workbook/read-zip-for-test.server.ts";
import { joinAsNewStudent, signInAsNewLecturer } from "./accounts.ts";
import { bbcaHolding } from "./bbca-holding.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingPage } from "./expect-missing-page.ts";
import { expectPageHeadings } from "./expect-page-headings.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { newDevice } from "./new-device.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { studentWithPortfolio } from "./student-with-portfolio.ts";
import { wideWord } from "./wide-word.ts";
import { widestClassNames } from "./widest-class-names.ts";

// The server runs with the fixture price source and the closes of the global setup, which e2e/measures.test.ts and e2e/portfolio.test.ts describe. bbca-holding.ts describes the portfolio of the first student, whose measures e2e/measures.test.ts gives, and the second student holds only the most starting cash of a class. itmg-portfolio.ts describes a portfolio whose ITMG has no monthly returns. Each name is as long as its field takes, so the screens show their widest content.
const { className, lecturerName, studentName } = widestClassNames;
const secondStudentName = wideWord("Kedua", nameMaximumLength);

const texts: Record<
  Locale,
  {
    classLink: string;
    title: string;
    backLink: string;
    valuationNotice: string;
    methodNotice: string;
    exportLink: string;
    exportNotice: string;
    rankedTitle: string;
    rankedNotice: string;
    unmeasuredTitle: string;
    noRanked: string;
    noStudents: string;
    bbcaStanding: readonly string[];
    cashStanding: readonly string[];
    itmgStanding: readonly string[];
    noHoldings: (name: string) => string;
    itmgFailure: (name: string) => string;
    portfolioLink: (name: string) => string;
    measuresLink: (name: string) => string;
    fileName: string;
    sheetHeadings: readonly string[];
    portfolioTitle: (name: string) => string;
    measuresTitle: (name: string) => string;
    allPortfoliosLink: string;
    portfolioHeadings: readonly string[];
    lecturerValuation: (name: string) => string;
    bbcaValue: readonly string[];
    chartNotice: (name: string) => string;
    legend: readonly string[];
    measuresHeadings: readonly string[];
    bbcaMeasures: string;
    notFoundTitle: string;
  }
> = {
  id: {
    classLink: "Portofolio dan ukuran mahasiswa",
    title: `Portofolio mahasiswa di ${className}`,
    backLink: `Kembali ke ${className}`,
    valuationNotice:
      "Setiap portofolio adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang dipegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI. Halaman portofolio setiap mahasiswa menunjukkan setiap harga tertunda, waktu pencatatannya, dan harga yang tidak dapat diambil oleh pembaruan terakhir.",
    methodNotice:
      "Ukuran ini adalah simulasi dari harga penutupan masa lalu. Setiap imbal hasil bulanan adalah perubahan harga penutupan final dari hari bursa terakhir suatu bulan ke hari bursa terakhir bulan berikutnya, tanpa dividen. Ukuran suatu saham atau portofolio memakai bulan-bulan di antara 60 bulan lengkap terakhir yang di dalamnya IHSG dan setiap sahamnya memiliki imbal hasil, dan memerlukan paling sedikit 24 imbal hasil bulanan. Setiap nilai berlaku per bulan.",
    exportLink: "Unduh portofolio ini sebagai spreadsheet",
    exportNotice:
      "Spreadsheet ini adalah workbook Excel yang memuat nilai dan ukuran di halaman ini, dengan urutan yang sama. Excel, Google Sheets, dan LibreOffice dapat membukanya, dan masing-masing menulis angkanya dalam format bahasanya sendiri.",
    rankedTitle: "Portofolio yang memiliki ukuran",
    rankedNotice:
      "Portolab mengurutkan portofolio ini menurut jarak imbal hasil yang diharapkannya dari garis pasar sekuritas, dari yang tertinggi sampai yang terendah. Jarak itu membandingkan imbal hasil yang diharapkan dengan imbal hasil yang disyaratkan CAPM untuk beta portofolio, sehingga urutannya menghargai imbal hasil sesuai risiko yang diambil portofolio, bukan imbal hasil saja.",
    unmeasuredTitle: "Portofolio yang belum memiliki ukuran",
    noRanked:
      "Belum ada portofolio di kelas ini yang memiliki ukuran, sehingga Portolab belum mengurutkan satu pun. Setiap portofolio di bawah menjelaskan alasannya.",
    noStudents:
      "Belum ada mahasiswa yang bergabung di kelas ini, sehingga belum ada portofolio untuk ditampilkan.",
    bbcaStanding: [
      "Jarak dari garis pasar sekuritas",
      "▼ -0,38%",
      "Imbal hasil yang diharapkan",
      "-0,05%",
      "Simpangan baku",
      "2,59%",
      "Beta terhadap IHSG",
      "0,34",
      "Imbal hasil yang disyaratkan CAPM",
      "0,33%",
      "Nilai total",
      "Rp\u00a01.003.259.000.000",
      "Imbal hasil sejak awal",
      "▲ +0,33%",
    ],
    cashStanding: [
      "Nilai total",
      "Rp\u00a01.000.000.000.000",
      "Imbal hasil sejak awal",
      "0,00%",
    ],
    itmgStanding: [
      "Nilai total",
      "Rp\u00a0996.063.812.500",
      "Imbal hasil sejak awal",
      "▼ -0,39%",
    ],
    noHoldings: (name) =>
      `${name} belum memegang saham, sehingga portofolionya hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio itu setelah order beli ${name} tereksekusi.`,
    itmgFailure: (name) =>
      `Saham ${name} dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, dan ITMG memiliki imbal hasil paling sedikit, sedangkan Portolab menghitung ukuran portofolio hanya dari paling sedikit 24 imbal hasil bulanan. Jika IHSG dan setiap saham ${name} tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran portofolio ${name} setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama November 2028.`,
    portfolioLink: (name) => `Portofolio ${name}`,
    measuresLink: (name) => `Imbal hasil dan risiko portofolio ${name}`,
    fileName: `Portofolio mahasiswa di ${className}.xlsx`,
    sheetHeadings: [
      "Nama",
      "Nama pengguna",
      "Alasan portofolio belum memiliki ukuran",
    ],
    portfolioTitle: (name) => `Portofolio ${name} di ${className}`,
    measuresTitle: (name) => `Imbal hasil dan risiko ${name} di ${className}`,
    allPortfoliosLink: `Kembali ke portofolio mahasiswa di ${className}`,
    portfolioHeadings: [
      "Nilai portofolio",
      "Saham yang dipegang",
      "Imbal hasil dibandingkan IHSG",
    ],
    lecturerValuation: (name) =>
      `Portofolio ${name} adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang dipegangnya pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, sehingga nilainya dapat berbeda dari nilai di bursa pada saat yang sama.`,
    bbcaValue: [
      "Kas",
      "Rp\u00a0505.259.000.000",
      "Nilai saham yang dipegang",
      "Rp\u00a0498.000.000.000",
      "Nilai total",
      "Rp\u00a01.003.259.000.000",
      "Kas awal",
      "Rp\u00a01.000.000.000.000",
      "Imbal hasil sejak awal",
      "▲ +0,33%",
    ],
    chartNotice: (name) =>
      `Grafik dan tabel di bawah membandingkan imbal hasil portofolio ${name} dengan imbal hasil IHSG sejak penutupan 26 Oktober 2026, sebelum ${name} dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.`,
    legend: ["Portofolio", "IHSG"],
    measuresHeadings: [
      "Ukuran portofolio",
      "Bobot portofolio",
      "Saham portofolio pada bulan-bulan ini",
      "Kovarians dan korelasi saham portofolio",
      "IHSG dan suku bunga bebas risiko",
      "Imbal hasil bulanan",
    ],
    bbcaMeasures: [
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
    notFoundTitle: "Halaman tidak ditemukan",
  },
  en: {
    classLink: "Portfolios and measures of the students",
    title: `Portfolios of the students in ${className}`,
    backLink: `Back to ${className}`,
    valuationNotice:
      "Each portfolio is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX. The page of the portfolio of each student shows each delayed price, when it was quoted, and the prices that the latest update could not fetch.",
    methodNotice:
      "These measures are a simulation from past closes. Each monthly return is the change of the final close from the last trading day of one month to the last trading day of the next, without dividends. The measures of a stock or of a portfolio use the months, among the latest 60 complete months, in which the IHSG and each of its stocks have a return, and they need at least 24 monthly returns. Every value is per month.",
    exportLink: "Download the portfolios as a spreadsheet",
    exportNotice:
      "The spreadsheet is an Excel workbook with the values and the measures of this page, in the same order. Excel, Google Sheets, and LibreOffice open it, and each writes its numbers in the format of its own language.",
    rankedTitle: "Portfolios with measures",
    rankedNotice:
      "Portolab ranks these portfolios by the distance of their expected return from the security market line, from the highest to the lowest. The distance compares the expected return with the return that CAPM requires for the beta of the portfolio, so the rank rewards the return for the risk that a portfolio takes, not the return alone.",
    unmeasuredTitle: "Portfolios without measures yet",
    noRanked:
      "No portfolio of this class has measures yet, so Portolab ranks none. Each portfolio below says why it has none.",
    noStudents:
      "No student has joined this class yet, so there is no portfolio to show.",
    bbcaStanding: [
      "Distance from the security market line",
      "▼ -0.38%",
      "Expected return",
      "-0.05%",
      "Standard deviation",
      "2.59%",
      "Beta against the IHSG",
      "0.34",
      "Return that CAPM requires",
      "0.33%",
      "Total value",
      "IDR\u00a01,003,259,000,000",
      "Return since the start",
      "▲ +0.33%",
    ],
    cashStanding: [
      "Total value",
      "IDR\u00a01,000,000,000,000",
      "Return since the start",
      "0.00%",
    ],
    itmgStanding: [
      "Total value",
      "IDR\u00a0996,063,812,500",
      "Return since the start",
      "▼ -0.39%",
    ],
    noHoldings: (name) =>
      `${name} holds no shares yet, so the portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of the portfolio once a purchase of ${name} fills.`,
    itmgFailure: (name) =>
      `The stocks of ${name} and the IHSG share 0 monthly returns in the latest 60 complete months, and ITMG has the fewest returns, but Portolab computes the measures of a portfolio only from at least 24 monthly returns. If the IHSG and each stock of ${name} keep a close at the end of every month, Portolab computes the measures of the portfolio of ${name} after the update of the price history that stores the close of the first trading day of November 2028.`,
    portfolioLink: (name) => `Portfolio of ${name}`,
    measuresLink: (name) => `Return and risk of the portfolio of ${name}`,
    fileName: `Portfolios of the students in ${className}.xlsx`,
    sheetHeadings: ["Name", "Username", "Why the portfolio has no measures"],
    portfolioTitle: (name) => `Portfolio of ${name} in ${className}`,
    measuresTitle: (name) => `Return and risk of ${name} in ${className}`,
    allPortfoliosLink: `Back to the portfolios of the students in ${className}`,
    portfolioHeadings: [
      "Value of the portfolio",
      "Holdings",
      "Return against the IHSG",
    ],
    lecturerValuation: (name) =>
      `The portfolio of ${name} is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, so a value can differ from the value on the exchange at the same moment.`,
    bbcaValue: [
      "Cash",
      "IDR\u00a0505,259,000,000",
      "Value of the holdings",
      "IDR\u00a0498,000,000,000",
      "Total value",
      "IDR\u00a01,003,259,000,000",
      "Starting cash",
      "IDR\u00a01,000,000,000,000",
      "Return since the start",
      "▲ +0.33%",
    ],
    chartNotice: (name) =>
      `The chart and the table below compare the return of the portfolio of ${name} with the return of the IHSG since the close of October 26, 2026, before ${name} could trade. Each of their returns uses the final closes of its day.`,
    legend: ["Portfolio", "IHSG"],
    measuresHeadings: [
      "Measures of the portfolio",
      "Weights of the portfolio",
      "The stocks of the portfolio in these months",
      "Covariances and correlations of the stocks of the portfolio",
      "The IHSG and the risk-free rate",
      "Monthly returns",
    ],
    bbcaMeasures: [
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
    notFoundTitle: "Page not found",
  },
};

/** Opens the portfolios of the students from the page of the class, which the lecturer shows. */
async function openPortfolios(
  lecturer: Page,
  locale: Locale,
  classPath: string,
): Promise<Locator> {
  await lecturer.goto(classPath);
  await lecturer.getByRole("link", { name: texts[locale].classLink }).click();
  await expect(lecturer).toHaveURL(`${classPath}/portfolios`);
  return lecturer.getByRole("main");
}

/** The item of the list of portfolios of a student, found by the name that the item starts with. */
function studentItem(main: Locator, name: string): Locator {
  return main.locator("li").filter({ hasText: name });
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`ranks the portfolios of the students with measures, lists the others with the reason, and downloads them as a workbook, in ${language}`, async ({
    page,
    browser,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    const testClass = await createTestClass(page, className);
    const first = await newDevice(browser, locale);
    await joinAsNewStudent(first, testClass.joinPath, studentName);
    // The holding goes to the one student of the class, so the second student joins after it.
    storeTestHolding(testClass.id, bbcaHolding);
    const second = await newDevice(browser, locale);
    await joinAsNewStudent(second, testClass.joinPath, secondStudentName);
    const main = await openPortfolios(page, locale, testClass.path);
    await expectPageHeadings(page, {
      title: text.title,
      headings: [text.rankedTitle, text.unmeasuredTitle],
    });
    await expect(
      main.getByRole("link", { name: text.backLink }),
    ).toHaveAttribute("href", testClass.path);
    for (const notice of [
      text.valuationNotice,
      text.methodNotice,
      text.exportNotice,
      text.rankedNotice,
    ]) {
      await expect(main).toContainText(notice);
    }
    const ranked = main.locator("ol > li");
    await expect(ranked).toHaveCount(1);
    await expect(ranked.locator("dl")).toHaveText(text.bbcaStanding.join(""));
    const unmeasured = main.locator("ul > li");
    await expect(unmeasured).toHaveCount(1);
    await expect(unmeasured.locator("dl")).toHaveText(
      text.cashStanding.join(""),
    );
    await expect(unmeasured).toContainText(text.noHoldings(secondStudentName));
    for (const name of [studentName, secondStudentName]) {
      const item = studentItem(main, name);
      await expect(
        item.getByRole("link", { name: text.portfolioLink(name), exact: true }),
      ).toBeVisible();
      await expect(
        item.getByRole("link", { name: text.measuresLink(name), exact: true }),
      ).toBeVisible();
    }
    await expectAccessibleScreen(page);

    const download = page.waitForEvent("download");
    await main.getByRole("link", { name: text.exportLink }).click();
    const workbook = await download;
    expect(workbook.suggestedFilename()).toBe(text.fileName);
    const chunks: Buffer[] = [];
    for await (const chunk of await workbook.createReadStream()) {
      chunks.push(chunk as Buffer);
    }
    const sheet = new TextDecoder().decode(
      readZipForTest(new Uint8Array(Buffer.concat(chunks))).get(
        "xl/worksheets/sheet1.xml",
      ),
    );
    // The students follow the headings in the order of the page.
    const cells = [
      text.title,
      ...text.sheetHeadings,
      studentName,
      secondStudentName,
      text.noHoldings(secondStudentName),
    ].map((value) => sheet.indexOf(`<t xml:space="preserve">${value}</t>`));
    expect(cells.every((index) => index >= 0)).toBe(true);
    expect(cells).toEqual(cells.toSorted((left, right) => left - right));
    await first.context().close();
    await second.context().close();
  });

  test(`opens the portfolio and the measures of a student for the lecturer of the class, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestHolding(classId, bbcaHolding);
      },
    });
    const main = await openPortfolios(page, locale, classPath);
    await main
      .getByRole("link", { name: text.measuresLink(studentName), exact: true })
      .click();
    await expect(page).toHaveURL(/\/students\/\d+\/measures$/);
    const measuresPath = new URL(page.url()).pathname;
    await expectPageHeadings(page, {
      title: text.measuresTitle(studentName),
      headings: text.measuresHeadings,
    });
    await expect(main).toContainText(text.methodNotice);
    await expect(main.locator("dl").first()).toHaveText(text.bbcaMeasures);
    // The page of a stock is for the students, so the lecturer reads each stock without a link.
    await expect(
      main.getByRole("link", { name: "BBCA", exact: true }),
    ).toHaveCount(0);
    for (const summary of await main.locator("summary").all()) {
      await summary.click();
    }
    await expectAccessibleScreen(page);
    await main
      .getByRole("link", { name: text.portfolioLink(studentName), exact: true })
      .click();
    await expect(page).toHaveURL(
      measuresPath.replace(/measures$/, "portfolio"),
    );
    await expectPageHeadings(page, {
      title: text.portfolioTitle(studentName),
      headings: text.portfolioHeadings,
    });
    await expect(main).toContainText(text.lecturerValuation(studentName));
    await expect(main.locator("dl").first()).toHaveText(
      text.bbcaValue.join(""),
    );
    await expect(main.locator("form")).toHaveCount(0);
    await expectAccessibleScreen(page);
    await main.getByRole("link", { name: text.allPortfoliosLink }).click();
    await expect(page).toHaveURL(`${classPath}/portfolios`);
    await student.context().close();
  });

  test(`explains why a portfolio has no measures yet, and shows its return against the IHSG to the lecturer, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
      givePortfolio: (classId) => {
        storeTestPurchases(classId, itmgPortfolio);
      },
    });
    const main = await openPortfolios(page, locale, classPath);
    await expectPageHeadings(page, {
      title: text.title,
      headings: [text.rankedTitle, text.unmeasuredTitle],
    });
    await expect(main).toContainText(text.noRanked);
    await expect(main.locator("ol")).toHaveCount(0);
    const item = main.locator("ul > li");
    await expect(item.locator("dl")).toHaveText(text.itmgStanding.join(""));
    await expect(item).toContainText(text.itmgFailure(studentName));
    await expectAccessibleScreen(page);
    await item
      .getByRole("link", { name: text.portfolioLink(studentName), exact: true })
      .click();
    await expect(main).toContainText(text.chartNotice(studentName));
    await expect(main).toContainText(text.legend.join(""));
    await expect(main.locator("canvas").first()).toBeVisible();
    await expectAccessibleScreen(page);
    await main
      .getByRole("link", { name: text.measuresLink(studentName), exact: true })
      .click();
    await expect(main).toContainText(text.itmgFailure(studentName));
    await student.context().close();
  });

  test(`says that no student has joined a class yet, in ${language}`, async ({
    page,
  }) => {
    await chooseLanguage(page, locale);
    await signInAsNewLecturer(page, lecturerName);
    const testClass = await createTestClass(page, className);
    const main = await openPortfolios(page, locale, testClass.path);
    await expectPageHeadings(page, { title: text.title, headings: [] });
    await expect(main).toContainText(text.noStudents);
    await expect(main.getByRole("link", { name: text.exportLink })).toHaveCount(
      0,
    );
    await expectAccessibleScreen(page);
  });

  test(`answers a student, another lecturer, and a student of another class at the addresses of the portfolios of a class as addresses that do not exist, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentWithPortfolio(page, browser, {
      locale,
    });
    const main = await openPortfolios(page, locale, classPath);
    const studentPath = await main
      .getByRole("link", { name: text.portfolioLink(studentName), exact: true })
      .getAttribute("href");
    if (studentPath === null) {
      throw new Error("The link to the portfolio of a student has no address.");
    }
    const studentMeasuresPath = studentPath.replace(/portfolio$/, "measures");
    const otherLecturer = await newDevice(browser, locale);
    await signInAsNewLecturer(otherLecturer, lecturerName);
    const otherClass = await createTestClass(otherLecturer, className);
    const otherStudentPath = studentPath.replace(classPath, otherClass.path);
    for (const [reader, path] of [
      [student, `${classPath}/portfolios`],
      [student, `${classPath}/portfolios/export`],
      [student, studentPath],
      [student, studentMeasuresPath],
      [otherLecturer, `${classPath}/portfolios`],
      [otherLecturer, `${classPath}/portfolios/export`],
      [otherLecturer, studentPath],
      [otherLecturer, otherStudentPath],
      [otherLecturer, otherStudentPath.replace(/portfolio$/, "measures")],
      [page, "/classes/999999999/portfolios"],
      [page, `${classPath}/students/999999999/portfolio`],
      [page, `${classPath}/students/x/measures`],
    ] as const) {
      await expectMissingPage(reader, path, text.notFoundTitle);
    }
    await student.context().close();
    await otherLecturer.context().close();
  });
}
