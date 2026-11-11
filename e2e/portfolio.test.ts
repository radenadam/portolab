import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingClassPages } from "./expect-missing-class-pages.ts";
import { expectPageHeadings } from "./expect-page-headings.ts";
import { itmgPortfolio } from "./itmg-portfolio.ts";
import { storeTestPurchases } from "./store-test-purchases.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { widestClassNames } from "./widest-class-names.ts";

// The server runs with the fixture price source, whose quotes are the closes of Friday 30 October 2026, and the global setup stores the closes of the IHSG and ITMG from Monday 26 to Friday 30 October 2026. The class has the most starting cash that Portolab accepts, so the screens show their widest amounts. itmg-portfolio.ts describes the purchases of the student. The values and the returns were computed with the decimal module of Python at 50 significant digits. The IHSG returns -5.88% from its close of 26 October, 5,373.09, to its delayed level, which is its close of 30 October, 5,057.05.
const { className } = widestClassNames;

const texts: Record<
  Locale,
  {
    portfolioLink: string;
    title: string;
    heading: string;
    navigation: string;
    portfolioTab: string;
    ordersTab: string;
    simulation: string;
    valuationNotice: string;
    headings: readonly string[];
    ticketTitle: string;
    startingFacts: readonly string[];
    noHoldings: string;
    value: string;
    facts: readonly string[];
    tableRow: readonly string[];
    listRow: readonly string[];
    chartNotice: string;
    tableLabel: string;
    rows: readonly (readonly [string, string, string])[];
    missingCloses: string;
    credit: string;
    measuresLink: string;
    stock: string;
    showPrice: string;
    buy: string;
    lots: string;
    place: string;
    placed: string;
    notFoundTitle: string;
  }
> = {
  id: {
    portfolioLink: "Portofolio Anda di kelas ini",
    title: `Portofolio di ${className}`,
    heading: "Portofolio Anda",
    navigation: "Navigasi utama",
    portfolioTab: "Portofolio",
    ordersTab: "Order",
    simulation: "Simulasi",
    valuationNotice:
      "Portofolio Anda adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang Anda pegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, sehingga nilainya dapat berbeda dari nilai di bursa pada saat yang sama.",
    headings: [
      "Nilai portofolio Anda",
      "Imbal hasil Anda dibandingkan IHSG",
      "Saham yang Anda pegang",
      "Ukuran portofolio Anda",
      "Garis pasar sekuritas",
    ],
    ticketTitle: "Pasang order",
    startingFacts: [
      "Imbal hasil sejak awal",
      "0,00%",
      "Kas",
      "Rp 1.000.000.000.000",
      "Kas awal",
      "Rp 1.000.000.000.000",
    ],
    noHoldings: "Anda belum memegang saham.",
    value: "Rp 996.063.812.500",
    facts: [
      "Imbal hasil sejak awal",
      "▼ -0,39%",
      "IHSG sejak awal",
      "▼ -5,88%",
      "Kas",
      "Rp 124.563.812.500",
      "Kas awal",
      "Rp 1.000.000.000.000",
    ],
    tableRow: [
      "ITMG",
      "35.000.000",
      "Rp 875.436.187.500",
      "Rp 24.90030 Okt 2026, 16.10",
      "Rp 871.500.000.000",
      "▼ -Rp 3.936.187.500▼ -0,45%",
    ],
    listRow: [
      "ITMG",
      "35.000.000 saham dengan biaya Rp 875.436.187.500, termasuk biaya broker.",
      "Harga tertunda Rp 24.900, tercatat pada 30 Okt 2026, 16.10 WIB.",
      "Rp 871.500.000.000",
      "▼ -Rp 3.936.187.500",
      "▼ -0,45%",
    ],
    chartNotice:
      "Grafik dan tabel di bawah membandingkan imbal hasil portofolio Anda dengan imbal hasil IHSG sejak penutupan 26 Oktober 2026, sebelum Anda dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.",
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
    measuresLink:
      "Lihat imbal hasil dan risiko portofolio Anda dan setiap saham",
    stock: "Saham",
    showPrice: "Tampilkan harganya",
    buy: "Beli",
    lots: "Jumlah lot",
    place: "Pasang order",
    placed:
      "Portolab menerima order Anda, dan daftar order di bawah menunjukkan statusnya.",
    notFoundTitle: "Halaman tidak ditemukan",
  },
  en: {
    portfolioLink: "Your portfolio in this class",
    title: `Portfolio in ${className}`,
    heading: "Your portfolio",
    navigation: "Main navigation",
    portfolioTab: "Portfolio",
    ordersTab: "Orders",
    simulation: "Simulation",
    valuationNotice:
      "Your portfolio is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, so a value can differ from the value on the exchange at the same moment.",
    headings: [
      "Value of your portfolio",
      "Your return against the IHSG",
      "Your holdings",
      "Measures of your portfolio",
      "Security market line",
    ],
    ticketTitle: "Place an order",
    startingFacts: [
      "Return since the start",
      "0.00%",
      "Cash",
      "IDR 1,000,000,000,000",
      "Starting cash",
      "IDR 1,000,000,000,000",
    ],
    noHoldings: "You hold no shares yet.",
    value: "IDR 996,063,812,500",
    facts: [
      "Return since the start",
      "▼ -0.39%",
      "IHSG since the start",
      "▼ -5.88%",
      "Cash",
      "IDR 124,563,812,500",
      "Starting cash",
      "IDR 1,000,000,000,000",
    ],
    tableRow: [
      "ITMG",
      "35,000,000",
      "IDR 875,436,187,500",
      "IDR 24,900Oct 30, 2026, 4:10 PM",
      "IDR 871,500,000,000",
      "▼ -IDR 3,936,187,500▼ -0.45%",
    ],
    listRow: [
      "ITMG",
      "35,000,000 shares that cost IDR 875,436,187,500, broker fees included.",
      "Delayed price IDR 24,900, quoted at Oct 30, 2026, 4:10 PM WIB.",
      "IDR 871,500,000,000",
      "▼ -IDR 3,936,187,500",
      "▼ -0.45%",
    ],
    chartNotice:
      "The chart and the table below compare the return of your portfolio with the return of the IHSG since the close of October 26, 2026, before you could trade. Each of their returns uses the final closes of its day.",
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
    measuresLink:
      "See the return and the risk of your portfolio and of each stock",
    stock: "Stock",
    showPrice: "Show the price",
    buy: "Buy",
    lots: "Lots",
    place: "Place the order",
    placed:
      "Portolab accepted your order, and your orders below show where it stands.",
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

/** The order ticket of the page, which a desktop shows beside the portfolio and a phone leaves to the page of the orders. */
function orderTicket(student: Page, locale: Locale): Locator {
  return student
    .getByRole("main")
    .locator("section")
    .filter({
      has: student.getByRole("heading", {
        level: 2,
        name: texts[locale].ticketTitle,
      }),
    });
}

// A phone shows the holdings as a list of rows and the order ticket on the page of the orders, and a desktop shows a table and the ticket beside the portfolio, as decision 0026 sets.
function isPhone(): boolean {
  return test.info().project.name === "phone";
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`shows the starting cash of a new student in the frame of the class, with the order ticket beside it on a desktop, and leads between the portfolio and the orders, in ${language}`, async ({
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
      heading: text.heading,
      headings: text.headings,
    });
    const main = student.getByRole("main");
    await expect(
      main.getByRole("link", { name: className, exact: true }),
    ).toHaveAttribute("href", classPath);
    await expect(main.locator("dl").first()).toHaveText(
      text.startingFacts.join(""),
    );
    await expect(main).toContainText(text.valuationNotice);
    await expect(main).toContainText(text.noHoldings);
    await expect(
      main.getByRole("link", { name: text.measuresLink }),
    ).toHaveAttribute("href", `${classPath}/measures`);
    await expect(
      student.getByText(text.simulation, { exact: true }),
    ).toBeVisible();
    await expect(orderTicket(student, locale)).toBeVisible({
      visible: !isPhone(),
    });
    await expectAccessibleScreen(student);

    const navigation = student.getByRole("navigation", {
      name: text.navigation,
    });
    await expect(
      navigation.getByRole("link", { name: text.portfolioTab }),
    ).toHaveAttribute("aria-current", "page");
    await navigation.getByRole("link", { name: text.ordersTab }).click();
    await expect(student).toHaveURL(`${classPath}/orders`);
    await navigation.getByRole("link", { name: text.portfolioTab }).click();
    await expect(student).toHaveURL(`${classPath}/portfolio`);
    await student.context().close();
  });

  test(`values the holding that purchases left at its delayed price as the headline, against the return of the IHSG, and compares the returns since the start in a chart and a table, in ${language}`, async ({
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
    await expect(main.getByText(text.value, { exact: true })).toBeVisible();
    await expect(main.locator("dl").first()).toHaveText(text.facts.join(""));
    if (isPhone()) {
      await expect(
        main.getByRole("listitem").filter({ hasText: "ITMG" }).locator("p"),
      ).toHaveText(text.listRow);
    } else {
      await expect(
        main.getByRole("row").filter({ hasText: "ITMG" }).locator("th, td"),
      ).toHaveText(text.tableRow);
    }
    await expect(main).toContainText(text.chartNotice);
    // The chart draws on canvases once the browser has loaded its library.
    await expect(main.locator("canvas").first()).toBeVisible();
    await main.getByText(text.tableLabel, { exact: true }).click();
    const rows = main.locator("details").first().locator("tbody tr");
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

  test(`places an order from the ticket beside the portfolio on a desktop, and opens the orders with it, in ${language}`, async ({
    page,
    browser,
  }) => {
    test.skip(
      isPhone(),
      "A phone shows the order ticket on the page of the orders.",
    );
    const { student, classPath } = await studentOfNewClass(page, browser, {
      locale,
      ...widestClassNames,
    });
    await openPortfolio(student, locale, classPath);
    const ticket = orderTicket(student, locale);
    await ticket.getByLabel(text.stock, { exact: true }).selectOption("BBCA");
    await ticket.getByRole("button", { name: text.showPrice }).click();
    await expect(student).toHaveURL(`${classPath}/portfolio?code=BBCA`);
    await ticket.getByLabel(text.buy, { exact: true }).check();
    await ticket.getByLabel(text.lots, { exact: true }).fill("1");
    await ticket.getByRole("button", { name: text.place }).click();
    await expect(student).toHaveURL(
      new RegExp(`${classPath}/orders\\?placed=\\d+$`),
    );
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await student.context().close();
  });

  test(`answers a lecturer and a student who is not in the class at the address of the portfolio as at an address that does not exist, in ${language}`, async ({
    page,
    browser,
  }) => {
    await expectMissingClassPages(page, browser, {
      locale,
      notFoundTitle: text.notFoundTitle,
      addresses: ({ classPath }) => [
        { reader: "lecturer", path: `${classPath}/portfolio` },
        { reader: "student", path: "/classes/999999999/portfolio" },
      ],
    });
  });
}
