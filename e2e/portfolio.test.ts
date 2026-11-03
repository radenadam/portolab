import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingPage } from "./expect-missing-page.ts";
import { expectPageHeadings } from "./expect-page-headings.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

// The server runs with the fixture price source, whose quotes are the closes of Friday 30 October 2026, and the global setup stores the closes of the IHSG and ITMG from Monday 26 to Friday 30 October 2026. The class has the most starting cash that Portolab accepts, so the screens show their widest amounts. itmg-portfolio.ts describes the purchases of the student. The values and the returns were computed with the decimal module of Python at 50 significant digits.
const { className } = widestClassNames;

const texts: Record<
  Locale,
  {
    portfolioLink: string;
    title: string;
    backLink: string;
    ordersLink: string;
    portfolioFromOrdersLink: string;
    valuationNotice: string;
    headings: readonly string[];
    startingValue: readonly string[];
    noHoldings: string;
    value: readonly string[];
    holding: readonly string[];
    chartNotice: string;
    legend: readonly string[];
    tableLabel: string;
    rows: readonly (readonly [string, string, string])[];
    missingCloses: string;
    credit: string;
    notFoundTitle: string;
  }
> = {
  id: {
    portfolioLink: "Portofolio Anda di kelas ini",
    title: `Portofolio di ${className}`,
    backLink: `Kembali ke ${className}`,
    ordersLink: "Pasang dan pantau order Anda",
    portfolioFromOrdersLink: "Lihat nilai dan imbal hasil portofolio Anda",
    valuationNotice:
      "Portofolio Anda adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang Anda pegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, sehingga nilainya dapat berbeda dari nilai di bursa pada saat yang sama.",
    headings: [
      "Nilai portofolio Anda",
      "Saham yang Anda pegang",
      "Imbal hasil Anda dibandingkan IHSG",
    ],
    startingValue: [
      "Kas",
      "Rp\u00a01.000.000.000.000",
      "Nilai saham yang Anda pegang",
      "Rp\u00a00",
      "Nilai total",
      "Rp\u00a01.000.000.000.000",
      "Kas awal",
      "Rp\u00a01.000.000.000.000",
      "Imbal hasil sejak awal",
      "0,00%",
    ],
    noHoldings: "Anda belum memegang saham.",
    value: [
      "Kas",
      "Rp\u00a0124.563.812.500",
      "Nilai saham yang Anda pegang",
      "Rp\u00a0871.500.000.000",
      "Nilai total",
      "Rp\u00a0996.063.812.500",
      "Kas awal",
      "Rp\u00a01.000.000.000.000",
      "Imbal hasil sejak awal",
      "▼ -0,39%",
    ],
    holding: [
      "Jumlah saham",
      "35.000.000",
      "Biaya termasuk biaya broker",
      "Rp\u00a0875.436.187.500",
      "Harga tertunda",
      "Rp\u00a024.900",
      "Tercatat pada (WIB)",
      "30 Okt 2026, 16.10",
      "Nilai",
      "Rp\u00a0871.500.000.000",
      "Untung atau rugi",
      "▼ -Rp\u00a03.936.187.500",
      "Imbal hasil atas biaya",
      "▼ -0,45%",
    ],
    chartNotice:
      "Grafik dan tabel di bawah membandingkan imbal hasil portofolio Anda dengan imbal hasil IHSG sejak penutupan 26 Oktober 2026, sebelum Anda dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.",
    legend: ["Portofolio Anda", "IHSG"],
    tableLabel: "Imbal hasil pada setiap penutupan",
    rows: [
      ["26 Okt 2026", "0,00%", "0,00%"],
      ["27 Okt 2026", "0,00%", "▼ -1,99%"],
      ["28 Okt 2026", "0,00%", "▼ -1,69%"],
      ["29 Okt 2026", "0,00%", "▼ -5,12%"],
      ["30 Okt 2026", "0,00%", "▼ -5,88%"],
    ],
    missingCloses:
      "Portolab belum menyimpan harga penutupan IHSG dan ITMG pada 2 November 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan masing-masing pada hari itu atau hari sesudahnya.",
    credit: "Grafik: TradingView Lightweight Charts™ © 2025 TradingView, Inc.",
    notFoundTitle: "Halaman tidak ditemukan",
  },
  en: {
    portfolioLink: "Your portfolio in this class",
    title: `Portfolio in ${className}`,
    backLink: `Back to ${className}`,
    ordersLink: "Place and follow your orders",
    portfolioFromOrdersLink: "See the value and the return of your portfolio",
    valuationNotice:
      "Your portfolio is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, so a value can differ from the value on the exchange at the same moment.",
    headings: [
      "Value of your portfolio",
      "Your holdings",
      "Your return against the IHSG",
    ],
    startingValue: [
      "Cash",
      "IDR\u00a01,000,000,000,000",
      "Value of your holdings",
      "IDR\u00a00",
      "Total value",
      "IDR\u00a01,000,000,000,000",
      "Starting cash",
      "IDR\u00a01,000,000,000,000",
      "Return since the start",
      "0.00%",
    ],
    noHoldings: "You hold no shares yet.",
    value: [
      "Cash",
      "IDR\u00a0124,563,812,500",
      "Value of your holdings",
      "IDR\u00a0871,500,000,000",
      "Total value",
      "IDR\u00a0996,063,812,500",
      "Starting cash",
      "IDR\u00a01,000,000,000,000",
      "Return since the start",
      "▼ -0.39%",
    ],
    holding: [
      "Shares",
      "35,000,000",
      "Cost with broker fees",
      "IDR\u00a0875,436,187,500",
      "Delayed price",
      "IDR\u00a024,900",
      "Quoted at (WIB)",
      "Oct 30, 2026, 4:10 PM",
      "Value",
      "IDR\u00a0871,500,000,000",
      "Gain or loss",
      "▼ -IDR\u00a03,936,187,500",
      "Return on the cost",
      "▼ -0.45%",
    ],
    chartNotice:
      "The chart and the table below compare the return of your portfolio with the return of the IHSG since the close of October 26, 2026, before you could trade. Each of their returns uses the final closes of its day.",
    legend: ["Your portfolio", "IHSG"],
    tableLabel: "The return at each close",
    rows: [
      ["Oct 26, 2026", "0.00%", "0.00%"],
      ["Oct 27, 2026", "0.00%", "▼ -1.99%"],
      ["Oct 28, 2026", "0.00%", "▼ -1.69%"],
      ["Oct 29, 2026", "0.00%", "▼ -5.12%"],
      ["Oct 30, 2026", "0.00%", "▼ -5.88%"],
    ],
    missingCloses:
      "Portolab has not stored the closes of IHSG and ITMG on November 2, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of each of them on that day or on a later day.",
    credit: "Chart: TradingView Lightweight Charts™ © 2025 TradingView, Inc.",
    notFoundTitle: "Page not found",
  },
};

/** Opens the portfolio of the student from the page of the class, which the student shows. */
async function openPortfolio(
  student: Page,
  locale: Locale,
  classPath: string,
): Promise<void> {
  await student
    .getByRole("link", { name: texts[locale].portfolioLink })
    .click();
  await expect(student).toHaveURL(`${classPath}/portfolio`);
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`shows the starting cash of a new student, and leads between the class, the portfolio, and the orders, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    await openPortfolio(student, locale, classPath);
    await expectPageHeadings(student, {
      title: text.title,
      headings: text.headings,
    });
    await expect(
      student.getByRole("link", { name: text.backLink }),
    ).toHaveAttribute("href", classPath);
    const main = student.getByRole("main");
    await expect(main).toContainText(text.valuationNotice);
    await expect(main.locator("dl").first()).toHaveText(
      text.startingValue.join(""),
    );
    await expect(main).toContainText(text.noHoldings);
    await expectAccessibleScreen(student);

    await student.getByRole("link", { name: text.ordersLink }).click();
    await expect(student).toHaveURL(`${classPath}/orders`);
    await student
      .getByRole("link", { name: text.portfolioFromOrdersLink })
      .click();
    await expect(student).toHaveURL(`${classPath}/portfolio`);
    await student.context().close();
  });

  test(`values the holding that purchases left at its delayed price, and compares the returns since the start with the IHSG in a chart and a table, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classId, classPath } = await studentOfNewClass(
      page,
      browser,
      { locale, ...widestClassNames },
    );
    storeTestPurchases(classId, itmgPortfolio);
    await openPortfolio(student, locale, classPath);
    const main = student.getByRole("main");
    const lists = main.locator("dl");
    await expect(lists.first()).toHaveText(text.value.join(""));
    await expect(
      main.locator("li", { hasText: "ITMG" }).locator("dl"),
    ).toHaveText(text.holding.join(""));
    await expect(main).toContainText(text.chartNotice);
    await expect(main).toContainText(text.legend.join(""));
    // The chart draws on canvases once the browser has loaded its library.
    await expect(main.locator("canvas").first()).toBeVisible();
    await main.getByText(text.tableLabel, { exact: true }).click();
    const rows = main.locator("details tbody tr");
    await expect(rows).toHaveCount(text.rows.length);
    for (const [index, row] of text.rows.entries()) {
      await expect(rows.nth(index).locator("th, td")).toHaveText(row);
    }
    await expect(main).toContainText(text.missingCloses);
    await expect(main.getByRole("link", { name: text.credit })).toHaveAttribute(
      "href",
      "https://www.tradingview.com/",
    );
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test(`answers a lecturer and a student who is not in the class at the address of the portfolio as at an address that does not exist, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    for (const [reader, path] of [
      [page, `${classPath}/portfolio`],
      [student, "/classes/999999999/portfolio"],
    ] as const) {
      await expectMissingPage(reader, path, text.notFoundTitle);
    }
    await student.context().close();
  });
}
