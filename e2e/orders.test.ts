import { expect, test } from "@playwright/test";
import type { Browser, Locator, Page } from "@playwright/test";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { reasonMaximumLength } from "../app/features/trading/reason-maximum-length.ts";
import { fieldMaximumLength } from "../app/form-size.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { expectMissingPage } from "./expect-missing-page.ts";
import { expectPageHeadings } from "./expect-page-headings.ts";
import { expectTexts } from "./expect-texts.ts";
import { studentOnNewClass } from "./student-on-new-class.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { studentOfNewClass } from "./student-of-new-class.ts";
import { wideWord } from "./wide-word.ts";
import { widestClassNames } from "./widest-class-names.ts";

// The server runs with the fixture price source, whose quotes are the closes of Friday 30 October 2026, which fixture-price-source.server.ts records. They are from no session of the trading day of an order that a test places, so every order waits. Every update lacks UNVR, whose quote the global setup stored before the server started, and WIFI, of which Portolab has no price. ITMG has the highest price and GOTO the widest change of the stocks that a student can choose. The global setup stores the month-end closes that give BBCA enough monthly returns and AADI too few. The class has the most starting cash that Portolab accepts, and the purchase has the largest order that IDX accepts at the highest price of the stocks that a student can buy, so the screens show their widest amounts. A text with a part that the test cannot know in advance, such as the time of an order or of the latest update of prices, is the tuple of its other parts.
const { className, studentName } = widestClassNames;

/** The stocks whose delayed price the tests show. */
type QuotedCode = "AADI" | "BBCA" | "GOTO" | "ITMG" | "UNVR";

/** The stocks that the tests choose, which are those with a delayed price and WIFI, of which Portolab has no price. */
type ChosenCode = QuotedCode | "WIFI";

// The names of the companies, which read the same in both languages.
const companyNames: Record<ChosenCode, string> = {
  AADI: "Adaro Andalan Indonesia Tbk",
  BBCA: "Bank Central Asia Tbk",
  GOTO: "GoTo Gojek Tokopedia Tbk",
  ITMG: "Indo Tambangraya Megah Tbk",
  UNVR: "Unilever Indonesia Tbk",
  WIFI: "Solusi Sinergi Digital Tbk",
};

// The fixture records GOTO at Rp24, at which the starting cash of Rp1,000,000,000,000 buys at most 416,042,602 lots with the broker fee of 0.15%, which costs Rp999,999,998,167 and leaves Rp1,833, as the decimal module of Python computed with ROUND_HALF_UP. It is the largest holding, in shares and in cost, that the cash of a class can buy at a price of the fixture.
const widestHolding = {
  cash: rupiah(1_833),
  code: "GOTO",
  shares: shares(41_604_260_200),
  cost: rupiah(999_999_998_167),
};

// A student who holds 3 lots of BBCA, bought at Rp4,980 for Rp1,496,241 with the broker fee, and Rp2,000,000 of cash. At the fixture price of Rp4,980, 5 lots cost Rp2,493,735 and 4 lots Rp1,994,988 with the fee of 0.15%, as the decimal module of Python computed with ROUND_HALF_UP, so the cash pays for at most 4 lots, and the student can sell at most 3.
const smallHolding = {
  cash: rupiah(2_000_000),
  code: "BBCA",
  shares: shares(300),
  cost: rupiah(1_496_241),
};

const texts: Record<
  Locale,
  {
    activityLink: string;
    title: string;
    heading: string;
    navigation: string;
    marketTab: string;
    fillNotice: string;
    headings: readonly string[];
    ticketTitle: string;
    simulation: string;
    rejectedTitle: string;
    quoteNotice: readonly [string, string];
    purchaseStep: string;
    saleStep: string;
    saleOfTwoLots: string;
    startingCash: readonly string[];
    noHoldings: string;
    dayNotice: readonly [string, string, string, string];
    labels: {
      stock: string;
      showPrice: string;
      otherStock: string;
      buy: string;
      sell: string;
      limitOrder: string;
      lots: string;
      limit: string;
      reason: string;
      place: string;
      cancel: string;
    };
    stockHint: string;
    priceTerms: { delayedPrice: string; change: string };
    quotes: Record<QuotedCode, readonly [string, string, string]>;
    sectors: Record<ChosenCode, string>;
    staleNotice: readonly [string, string];
    missingNotice: readonly [string, string];
    noPriceOrder: string;
    unknownStock: readonly [string, string];
    lotsHint: string;
    noOpenOrders: string;
    noPastOrders: string;
    noStock: string;
    noSide: string;
    emptyLots: string;
    tooFewReturns: string;
    noShares: string;
    typedLimit: string;
    noReferenceClose: readonly [string, string, string];
    largestOrder: string;
    placed: string;
    purchase: readonly string[];
    cashWithPurchase: readonly string[];
    cancelled: readonly [string, string];
    ended: readonly [string, string];
    holding: readonly string[];
    sale: readonly string[];
    notEnoughCash: string;
    notFoundTitle: string;
    reasonHint: string;
    reasonTooLong: string;
    reasonFarTooLong: string;
    reasonLabel: string;
    purchaseOfOneLot: string;
    studentPortfolioLink: string;
    reasonsTitle: string;
  }
> = {
  id: {
    activityLink: "Aktivitas",
    title: `Order di ${className}`,
    heading: "Order Anda",
    navigation: "Navigasi utama",
    marketTab: "Pasar",
    fillNotice:
      "Portolab mengeksekusi order pada harga tertunda dari Yahoo Finance, sekitar 10 menit di belakang BEI, yang tercatat pada sesi I atau sesi II hari bursa order tersebut. Karena itu, harga eksekusi dapat berbeda dari harga di bursa pada saat yang sama.",
    headings: [
      "Kas Anda",
      "Saham yang Anda pegang",
      "Pasang order",
      "Order yang masih terbuka",
      "Order sebelumnya",
    ],
    ticketTitle: "Pasang order",
    simulation:
      "Simulasi. Tidak ada uang sungguhan dan tidak ada transaksi sungguhan.",
    rejectedTitle: "Portolab tidak menerima order ini",
    quoteNotice: ["Harga tertunda sekitar 10 menit, tercatat pada ", " WIB."],
    purchaseStep: "Ubah menjadi 4 lot",
    saleStep: "Ubah menjadi 3 lot",
    saleOfTwoLots: "Jual 2 lot BBCA pada harga pasar",
    startingCash: [
      "Kas",
      "Rp\u00a01.000.000.000.000",
      "Kas yang disisihkan",
      "Rp\u00a00",
      "Kas yang tersedia",
      "Rp\u00a01.000.000.000.000",
    ],
    noHoldings: "Anda tidak memegang saham.",
    dayNotice: [
      "Order yang Anda pasang sekarang dapat tereksekusi pada harga tertunda yang tercatat pada sesi I atau sesi II tanggal ",
      ", mulai pukul ",
      " WIB, dan kedaluwarsa pada pukul ",
      " WIB jika belum tereksekusi.",
    ],
    labels: {
      stock: "Saham",
      showPrice: "Tampilkan harganya",
      otherStock: "Pilih saham lain",
      buy: "Beli",
      sell: "Jual",
      limitOrder: "Order limit",
      lots: "Jumlah lot",
      limit: "Harga limit",
      reason: "Alasan (opsional)",
      place: "Pasang order",
      cancel: "Batalkan order ini",
    },
    stockHint:
      "Anda dapat membeli saham LQ45 yang memiliki imbal hasil bulanan yang dibutuhkan ukuran portofolio, dan menjual saham yang Anda pegang.",
    priceTerms: {
      delayedPrice: "Harga tertunda",
      change: "Perubahan dari harga penutupan sebelumnya",
    },
    sectors: {
      AADI: "Energi",
      BBCA: "Keuangan",
      GOTO: "Teknologi",
      ITMG: "Energi",
      UNVR: "Barang Konsumen Primer",
      WIFI: "Teknologi",
    },
    quotes: {
      AADI: ["Rp\u00a011.475", "▲ +3,15%", "30 Okt 2026, 16.14"],
      BBCA: ["Rp\u00a04.980", "▲ +0,81%", "30 Okt 2026, 16.14"],
      GOTO: ["Rp\u00a024", "▲ +33,33%", "30 Okt 2026, 16.14"],
      ITMG: ["Rp\u00a024.900", "▲ +1,22%", "30 Okt 2026, 16.10"],
      UNVR: ["Rp\u00a01.390", "▼ -0,71%", "30 Okt 2026, 16.14"],
    },
    staleNotice: [
      "Portolab tidak dapat memperbarui harga UNVR pada ",
      " WIB, jadi Portolab memakai harga terakhir UNVR yang tersimpan. Portolab ",
    ],
    missingNotice: [
      "Portolab belum memiliki harga WIFI, karena percobaan terakhir untuk mengambilnya pada ",
      " WIB gagal. Portolab ",
    ],
    noPriceOrder:
      "Anda dapat memasang order WIFI setelah pembaruan harga berikutnya membawa harga tertunda WIFI.",
    unknownStock: [
      'Alamat halaman ini menyebut "',
      '" sebagai saham, tetapi Portolab hanya memperdagangkan saham yang ada di daftar kolom "Saham". Pilih salah satunya.',
    ],
    lotsHint:
      "Satu lot berisi 100 saham. Satu order berisi 1 lot sampai 50.000 lot, yaitu order terbesar yang diterima BEI.",
    noOpenOrders: "Anda tidak memiliki order yang masih terbuka.",
    noPastOrders: "Belum ada order Anda yang berakhir.",
    noStock: 'Kolom "Saham" belum berisi saham. Pilih saham untuk order ini.',
    noSide:
      'Kolom "Beli atau jual" belum berisi pilihan. Pilih "Beli" atau "Jual".',
    emptyLots:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
    tooFewReturns:
      "AADI baru memiliki 21 imbal hasil bulanan, sedangkan Portolab menghitung ukuran portofolio hanya jika setiap sahamnya memiliki 24 imbal hasil bulanan. Jika AADI tetap memiliki harga penutupan di akhir setiap bulan dan tetap termasuk LQ45, Anda dapat membelinya setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Januari 2027. Portolab juga harus sudah mencatat aturan BEI dan daftar saham LQ45 untuk hari pembelian itu.",
    noShares:
      "Order ini menjual 5 lot BBCA, sedangkan Anda tidak memegang saham BBCA, dan Anda hanya dapat menjual saham yang Anda pegang. Periksa kembali sahamnya, dan apakah Anda bermaksud membelinya.",
    typedLimit: "4.980",
    noReferenceClose: [
      "BEI menetapkan rentang harga order limit dari harga penutupan terakhir BBCA sebelum hari bursa order ini, tetapi Portolab belum memiliki harga penutupan final BBCA untuk ",
      ". Order limit dapat dipasang setelah pembaruan riwayat harga menyimpan harga penutupan itu, jika BBCA diperdagangkan pada ",
      ", atau setelah Portolab memiliki harga BBCA dari hari bursa order ini. Order harga pasar tidak membutuhkan limit.",
    ],
    largestOrder: "50.000",
    placed:
      "Portolab menerima order Anda, dan daftar order di bawah menunjukkan statusnya.",
    purchase: [
      "Beli 50.000 lot BBCA pada harga pasar",
      "Order ini menunggu harga tertunda BBCA dari sesi I atau sesi II.",
      "Order ini menyisihkan Rp\u00a024.937.350.000 dari kas Anda.",
    ],
    cashWithPurchase: [
      "Rp\u00a01.000.000.000.000",
      "Rp\u00a024.937.350.000",
      "Rp\u00a0975.062.650.000",
    ],
    cancelled: ["Anda membatalkannya pada ", " WIB."],
    ended: [
      "Order Anda atas 50.000 lot BBCA yang dipasang pada ",
      " WIB tidak lagi terbuka, sehingga Portolab tidak dapat membatalkannya. Daftar order sebelumnya di bawah menunjukkan bagaimana order itu berakhir.",
    ],
    holding: [
      "GOTO",
      "GoTo Gojek Tokopedia Tbk",
      "41.604.260.200 saham dengan biaya Rp\u00a0999.999.998.167, termasuk biaya broker.",
    ],
    sale: [
      "Jual 50.000 lot GOTO pada harga pasar",
      "Order ini menyisihkan 5.000.000 saham GOTO.",
      "Order jual Anda yang masih terbuka menyisihkan 5.000.000 saham dari saham ini.",
    ],
    notEnoughCash:
      "Membeli 1 lot BBCA pada harga Rp\u00a04.980 membutuhkan Rp\u00a0498.747, yaitu Rp\u00a0498.000 untuk saham dan Rp\u00a0747 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a01.833. Kas Anda yang tersedia hanya cukup untuk membayar 1 lot saham pada harga paling tinggi Rp\u00a018. Kas Anda yang tersedia masih kurang Rp\u00a0496.914 untuk order ini, dan menjual saham yang Anda pegang menambah kas itu. Order jual GOTO Anda yang masih terbuka membawa kas saat tereksekusi.",
    notFoundTitle: "Halaman tidak ditemukan",
    reasonHint:
      "Mengapa Anda memasang order ini, paling banyak 500 karakter. Portolab menyimpannya bersama order ini, dan dosen kelas ini dapat membacanya.",
    reasonTooLong:
      'Kolom "Alasan (opsional)" memuat paling banyak 500 karakter, tetapi isinya 501 karakter. Persingkat isinya.',
    reasonFarTooLong:
      'Kolom "Alasan (opsional)" berisi 8.001 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
    reasonLabel: "Alasan Anda: ",
    purchaseOfOneLot: "Beli 1 lot BBCA pada harga pasar",
    studentPortfolioLink: `Portofolio ${studentName}`,
    reasonsTitle: "Alasan order",
  },
  en: {
    activityLink: "Activity",
    title: `Orders in ${className}`,
    heading: "Your orders",
    navigation: "Main navigation",
    marketTab: "Market",
    fillNotice:
      "Portolab fills an order at a delayed price from Yahoo Finance, about 10 minutes behind IDX, that was quoted in session I or session II of the trading day of the order. So a fill can differ from the price on the exchange at the same moment.",
    headings: [
      "Your cash",
      "Your holdings",
      "Place an order",
      "Open orders",
      "Past orders",
    ],
    ticketTitle: "Place an order",
    simulation: "Simulation. No real money and no real trades.",
    rejectedTitle: "Portolab did not accept this order",
    quoteNotice: ["Delayed by about 10 minutes, quoted at ", " WIB."],
    purchaseStep: "Change to 4 lots",
    saleStep: "Change to 3 lots",
    saleOfTwoLots: "Sell 2 lots of BBCA at the market price",
    startingCash: [
      "Cash",
      "IDR\u00a01,000,000,000,000",
      "Cash set aside",
      "IDR\u00a00",
      "Available cash",
      "IDR\u00a01,000,000,000,000",
    ],
    noHoldings: "You hold no shares.",
    dayNotice: [
      "An order that you place now can fill at a delayed price quoted in session I or session II on ",
      ", from ",
      " WIB, and it expires at ",
      " WIB if it has not filled by then.",
    ],
    labels: {
      stock: "Stock",
      showPrice: "Show the price",
      otherStock: "Choose another stock",
      buy: "Buy",
      sell: "Sell",
      limitOrder: "Limit order",
      lots: "Lots",
      limit: "Limit price",
      reason: "Reason (optional)",
      place: "Place the order",
      cancel: "Cancel this order",
    },
    stockHint:
      "You can buy a stock of the LQ45 that has the monthly returns that the measures of a portfolio need, and sell a stock that you hold.",
    priceTerms: {
      delayedPrice: "Delayed price",
      change: "Change from the previous close",
    },
    sectors: {
      AADI: "Energy",
      BBCA: "Financials",
      GOTO: "Technology",
      ITMG: "Energy",
      UNVR: "Consumer Non-Cyclicals",
      WIFI: "Technology",
    },
    quotes: {
      AADI: ["IDR\u00a011,475", "▲ +3.15%", "Oct 30, 2026, 4:14 PM"],
      BBCA: ["IDR\u00a04,980", "▲ +0.81%", "Oct 30, 2026, 4:14 PM"],
      GOTO: ["IDR\u00a024", "▲ +33.33%", "Oct 30, 2026, 4:14 PM"],
      ITMG: ["IDR\u00a024,900", "▲ +1.22%", "Oct 30, 2026, 4:10 PM"],
      UNVR: ["IDR\u00a01,390", "▼ -0.71%", "Oct 30, 2026, 4:14 PM"],
    },
    staleNotice: [
      "Portolab could not update the price of UNVR at ",
      " WIB, so it uses the last price of UNVR that it stored. Portolab ",
    ],
    missingNotice: [
      "Portolab has no price for WIFI yet, because its latest attempt to fetch it at ",
      " WIB failed. Portolab ",
    ],
    noPriceOrder:
      "You can place an order of WIFI once the next update of prices brings a delayed price of WIFI.",
    unknownStock: [
      'The address of this page names "',
      '" as the stock, but Portolab trades only the stocks in the list of the field "Stock". Choose one of them.',
    ],
    lotsHint:
      "A lot is 100 shares. An order has 1 lot to 50,000 lots, the largest order that IDX accepts.",
    noOpenOrders: "You have no open order.",
    noPastOrders: "None of your orders has ended yet.",
    noStock:
      'The field "Stock" holds no stock yet. Choose the stock of the order.',
    noSide:
      'The field "Buy or sell" holds no choice yet. Choose "Buy" or "Sell".',
    emptyLots: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
    tooFewReturns:
      "AADI has 21 monthly returns, but Portolab computes the measures of a portfolio only when each of its stocks has 24 monthly returns. If AADI keeps a close at the end of every month and stays in the LQ45, you can buy it after the update of the price history that stores the close of the first trading day of January 2027. Portolab must also have recorded the rules of IDX and which stocks are in the LQ45 for the day of the purchase.",
    noShares:
      "This order sells 5 lots of BBCA, but you hold no shares of BBCA, and you can sell only shares that you hold. Check the stock, and whether you meant to buy it.",
    typedLimit: "4,980",
    noReferenceClose: [
      "IDX sets the range of prices of a limit order from the latest close of BBCA before the trading day of the order, but Portolab has no final close of BBCA for ",
      " yet. A limit order becomes possible once an update of the price history stores that close, if BBCA traded on ",
      ", or once Portolab has a price of BBCA from the trading day of the order. A market order needs no limit.",
    ],
    largestOrder: "50,000",
    placed:
      "Portolab accepted your order, and your orders below show where it stands.",
    purchase: [
      "Buy 50,000 lots of BBCA at the market price",
      "It waits for a delayed price of BBCA from session I or session II.",
      "It sets aside IDR\u00a024,937,350,000 of your cash.",
    ],
    cashWithPurchase: [
      "IDR\u00a01,000,000,000,000",
      "IDR\u00a024,937,350,000",
      "IDR\u00a0975,062,650,000",
    ],
    cancelled: ["You cancelled it on ", " WIB."],
    ended: [
      "Your order of 50,000 lots of BBCA placed on ",
      " WIB is no longer open, so Portolab cannot cancel it. Your past orders below show how it ended.",
    ],
    holding: [
      "GOTO",
      "GoTo Gojek Tokopedia Tbk",
      "41,604,260,200 shares that cost IDR\u00a0999,999,998,167, broker fees included.",
    ],
    sale: [
      "Sell 50,000 lots of GOTO at the market price",
      "It sets aside 5,000,000 shares of GOTO.",
      "Your open sell order sets aside 5,000,000 shares of this holding.",
    ],
    notEnoughCash:
      "Buying 1 lot of BBCA at IDR\u00a04,980 costs IDR\u00a0498,747, which is IDR\u00a0498,000 for the shares and IDR\u00a0747 for the broker fee, but your available cash is IDR\u00a01,833. Your available cash pays for 1 lot of a stock only at a price of at most IDR\u00a018. This order needs IDR\u00a0496,914 more than your available cash, and selling shares that you hold adds to that cash. Your open sell order of GOTO brings cash when it fills.",
    notFoundTitle: "Page not found",
    reasonHint:
      "Why you place this order, in at most 500 characters. Portolab keeps it with the order, and the lecturer of this class can read it.",
    reasonTooLong:
      'The field "Reason (optional)" holds at most 500 characters, but it has 501. Shorten it.',
    reasonFarTooLong:
      'The field "Reason (optional)" has 8,001 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
    reasonLabel: "Your reason: ",
    purchaseOfOneLot: "Buy 1 lot of BBCA at the market price",
    studentPortfolioLink: `Portfolio of ${studentName}`,
    reasonsTitle: "Reasons for the orders",
  },
};

/** Creates a lecturer with a class and a student who joined it on a device of their own, and opens the orders of the student from the page of the class. Returns the page of the student and the class. */
async function openOrdersOfNewStudent(
  page: Page,
  browser: Browser,
  locale: Locale,
): Promise<{ student: Page; classId: ClassId; classPath: string }> {
  const joined = await studentOfNewClass(page, browser, {
    locale,
    ...widestClassNames,
  });
  await joined.student
    .getByRole("link", { name: texts[locale].activityLink, exact: true })
    .click();
  await expect(joined.student).toHaveURL(`${joined.classPath}/orders`);
  return joined;
}

/** Chooses a stock in the form that chooses one, which offers it under the name of its company, or no stock for an empty code, and sends the form, which opens the orders with the stock in the address. */
async function chooseStock(
  page: Page,
  locale: Locale,
  code: ChosenCode | "",
): Promise<void> {
  const { labels } = texts[locale];
  const main = page.getByRole("main");
  const field = main.getByLabel(labels.stock, { exact: true });
  if (code !== "") {
    await expect(
      field.getByRole("option", {
        name: `${code} · ${companyNames[code]}`,
        exact: true,
      }),
    ).toBeAttached();
  }
  await field.selectOption(code);
  await main.getByRole("button", { name: labels.showPrice }).click();
  await expect(page).toHaveURL(new RegExp(`/orders\\?code=${code}$`));
}

/** Leaves the stock that the page shows through the link that chooses another one, and chooses a stock. */
async function chooseAnotherStock(
  page: Page,
  locale: Locale,
  code: ChosenCode,
): Promise<void> {
  await page
    .getByRole("main")
    .getByRole("link", { name: texts[locale].labels.otherStock })
    .click();
  await expect(page).toHaveURL(/\/orders$/);
  await chooseStock(page, locale, code);
}

/** The order ticket, which the page of the orders shows first on a phone and beside the orders on a desktop. */
function orderTicket(page: Page, locale: Locale): Locator {
  return page
    .getByRole("main")
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        level: 2,
        name: texts[locale].ticketTitle,
      }),
    });
}

/** Checks that the ticket shows the chosen stock with the name and the sector of its company. */
async function expectChosenStock(
  page: Page,
  locale: Locale,
  code: ChosenCode,
): Promise<void> {
  const ticket = orderTicket(page, locale);
  for (const name of [code, companyNames[code], texts[locale].sectors[code]]) {
    await expect(ticket.getByText(name, { exact: true })).toBeVisible();
  }
}

/** Checks that the ticket shows the chosen stock with its company, its latest delayed price, its change, its delay, and the time of its quote. */
async function expectChosenPrice(
  page: Page,
  locale: Locale,
  code: QuotedCode,
): Promise<void> {
  const { priceTerms, quotes, quoteNotice } = texts[locale];
  const [price, change, quotedAt] = quotes[code];
  const ticket = orderTicket(page, locale);
  await expectChosenStock(page, locale, code);
  await expect(ticket.locator("dl")).toHaveText(
    [priceTerms.delayedPrice, price, priceTerms.change, change].join(""),
  );
  await expect(ticket).toContainText(
    `${quoteNotice[0]}${quotedAt}${quoteNotice[1]}`,
  );
}

/** Fills the order form with the fields that a test gives and sends it. The form chooses a market order until the test chooses a limit order, and it keeps the reason that the field holds until the test gives one. */
async function placeOrder(
  page: Page,
  locale: Locale,
  order: {
    side?: "buy" | "sell";
    isLimit?: boolean;
    lots?: string;
    limit?: string;
    reason?: string;
  },
): Promise<void> {
  const { labels } = texts[locale];
  const main = page.getByRole("main");
  if (order.side !== undefined) {
    await main.getByLabel(labels[order.side], { exact: true }).check();
  }
  if (order.isLimit === true) {
    await main.getByLabel(labels.limitOrder, { exact: true }).check();
  }
  await main.getByLabel(labels.lots, { exact: true }).fill(order.lots ?? "");
  await main.getByLabel(labels.limit, { exact: true }).fill(order.limit ?? "");
  if (order.reason !== undefined) {
    await main.getByLabel(labels.reason, { exact: true }).fill(order.reason);
  }
  await main.getByRole("button", { name: labels.place }).click();
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`places a market purchase, cancels it, and explains each order that Portolab refuses, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await openOrdersOfNewStudent(
      page,
      browser,
      locale,
    );
    await expectPageHeadings(student, {
      title: text.title,
      heading: text.heading,
      headings: text.headings,
    });
    await expect(
      student
        .getByRole("main")
        .getByRole("link", { name: className, exact: true }),
    ).toHaveAttribute("href", classPath);
    const navigation = student.getByRole("navigation", {
      name: text.navigation,
    });
    await expect(
      navigation.getByRole("link", { name: text.marketTab }),
    ).toHaveAttribute("href", `${classPath}/market`);
    await expect(student.locator("main dl")).toHaveText(
      text.startingCash.join(""),
    );
    await expectTexts(student.getByRole("main"), [
      text.fillNotice,
      text.noHoldings,
      text.stockHint,
      text.noOpenOrders,
      text.noPastOrders,
      text.simulation,
    ]);
    await expect(
      student.getByRole("button", { name: text.labels.place }),
    ).toHaveCount(0);
    await expectAccessibleScreen(student);

    await chooseStock(student, locale, "");
    await expectTexts(student.getByRole("main"), [text.noStock]);
    await expectAccessibleScreen(student);

    await chooseStock(student, locale, "AADI");
    await expectChosenPrice(student, locale, "AADI");
    await expectTexts(student.getByRole("main"), [
      ...text.dayNotice,
      text.lotsHint,
    ]);
    await placeOrder(student, locale, {});
    await expectTexts(student.getByRole("main"), [text.noSide, text.emptyLots]);
    await expectAccessibleScreen(student);
    await placeOrder(student, locale, { side: "buy", lots: "1" });
    await expect(student.getByRole("alert")).toHaveText(
      `${text.rejectedTitle}${text.tooFewReturns}`,
    );

    await chooseAnotherStock(student, locale, "BBCA");
    await expectChosenPrice(student, locale, "BBCA");
    await placeOrder(student, locale, { side: "sell", lots: "5" });
    await expect(student.getByRole("alert")).toHaveText(
      `${text.rejectedTitle}${text.noShares}`,
    );
    await placeOrder(student, locale, {
      side: "buy",
      isLimit: true,
      lots: "5",
      limit: text.typedLimit,
    });
    await expectTexts(student.getByRole("alert"), text.noReferenceClose);
    await expect(
      student.getByRole("main").getByLabel(text.labels.limit, { exact: true }),
    ).toHaveValue(text.typedLimit);
    // A refused order keeps the stock of the address and its price.
    await expect(student).toHaveURL(/\/orders\?code=BBCA$/);
    await expectChosenPrice(student, locale, "BBCA");
    await expectAccessibleScreen(student);

    await student.reload();
    await placeOrder(student, locale, {
      side: "buy",
      lots: text.largestOrder,
    });
    await expect(student).toHaveURL(/\/orders\?placed=\d+$/);
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await expectTexts(student.getByRole("main"), [
      ...text.purchase,
      ...text.cashWithPurchase,
    ]);
    await expectAccessibleScreen(student);

    // A second tab keeps the order open, as a page that the student opened before cancelling it elsewhere.
    const staleTab = await student.context().newPage();
    await staleTab.goto(student.url());
    await student
      .getByRole("main")
      .getByRole("button", { name: text.labels.cancel })
      .click();
    await expect(student.getByText(text.cancelled[0])).toContainText(
      text.cancelled[1],
    );
    await expectTexts(student.getByRole("main"), [
      text.noOpenOrders,
      ...text.startingCash,
    ]);
    await staleTab
      .getByRole("main")
      .getByRole("button", { name: text.labels.cancel })
      .click();
    await expect(staleTab.getByRole("alert")).toContainText(text.ended[0]);
    await expect(staleTab.getByRole("alert")).toContainText(text.ended[1]);
    // After the refusal, the page loads the orders as they stand, so the order shows how it ended.
    await expect(staleTab.getByText(text.cancelled[0])).toContainText(
      text.cancelled[1],
    );
    await expectTexts(staleTab.getByRole("main"), [text.noOpenOrders]);
    await expectAccessibleScreen(staleTab);
    await student.context().close();
  });

  test(`sells from the largest holding that the cash of a class buys, and explains a purchase that the cash left does not pay for, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classId } = await openOrdersOfNewStudent(
      page,
      browser,
      locale,
    );
    storeTestHolding(classId, widestHolding);
    await student.reload();
    await expectTexts(student.getByRole("main"), text.holding);
    await chooseStock(student, locale, "GOTO");
    await expectChosenPrice(student, locale, "GOTO");
    await placeOrder(student, locale, {
      side: "sell",
      lots: text.largestOrder,
    });
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await expectTexts(student.getByRole("main"), [
      ...text.holding,
      ...text.sale,
    ]);
    await expectAccessibleScreen(student);
    await chooseStock(student, locale, "BBCA");
    await placeOrder(student, locale, { side: "buy", lots: "1" });
    await expect(student.getByRole("alert")).toHaveText(
      `${text.rejectedTitle}${text.notEnoughCash}`,
    );
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test(`offers the largest purchase that the cash pays for and the largest sale that the free shares allow as the step of a rejection, which changes the lots of the order form, while Enter in a field still sends the order, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classId } = await openOrdersOfNewStudent(
      page,
      browser,
      locale,
    );
    storeTestHolding(classId, smallHolding);
    await student.reload();
    await chooseStock(student, locale, "BBCA");
    const lotsField = student
      .getByRole("main")
      .getByLabel(text.labels.lots, { exact: true });
    await placeOrder(student, locale, { side: "buy", lots: "5" });
    const rejection = student.getByRole("alert");
    await expect(rejection).toContainText(text.rejectedTitle);
    await expectAccessibleScreen(student);
    await rejection.getByRole("button", { name: text.purchaseStep }).click();
    await expect(lotsField).toHaveValue("4");
    await expect(rejection).toHaveCount(0);
    await placeOrder(student, locale, { side: "sell", lots: "5" });
    await rejection.getByRole("button", { name: text.saleStep }).click();
    await expect(lotsField).toHaveValue("3");
    // A student who types other lots while a rejection offers its step, and presses Enter, places the order with the lots that they typed.
    await placeOrder(student, locale, { side: "sell", lots: "5" });
    await expect(
      rejection.getByRole("button", { name: text.saleStep }),
    ).toBeVisible();
    await lotsField.fill("2");
    await lotsField.press("Enter");
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await expectTexts(student.getByRole("main"), [text.saleOfTwoLots]);
    await student.context().close();
  });

  test(`keeps the reason that a student writes with the order, which the lecturer of the class reads, and explains a reason that is too long at its field, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await openOrdersOfNewStudent(
      page,
      browser,
      locale,
    );
    await chooseStock(student, locale, "BBCA");
    const main = student.getByRole("main");
    await expectTexts(main, [text.reasonHint]);
    const reasonField = main.getByLabel(text.labels.reason, { exact: true });
    // A reason one character past its maximum, and one past the maximum of any field, each as one word.
    const justPast = wideWord("Alasan", reasonMaximumLength + 1);
    await placeOrder(student, locale, {
      side: "buy",
      lots: "1",
      reason: justPast,
    });
    await expect(
      main.getByText(text.reasonTooLong, { exact: true }),
    ).toBeVisible();
    await expect(reasonField).toHaveValue(justPast);
    await expect(reasonField).toHaveAttribute("aria-invalid", "true");
    await expectAccessibleScreen(student);
    await placeOrder(student, locale, {
      side: "buy",
      lots: "1",
      reason: wideWord("Alasan", fieldMaximumLength + 1),
    });
    await expect(
      main.getByText(text.reasonFarTooLong, { exact: true }),
    ).toBeVisible();
    await expectAccessibleScreen(student);

    // The longest reason that Portolab keeps, as one word, so each list that shows it is checked with its widest content.
    const widestReason = wideWord("Alasan", reasonMaximumLength);
    await placeOrder(student, locale, {
      side: "buy",
      lots: "1",
      reason: widestReason,
    });
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await expect(
      main.getByText(`${text.reasonLabel}${widestReason}`, { exact: true }),
    ).toBeVisible();
    await expectAccessibleScreen(student);

    await page.goto(`${classPath}/portfolios`);
    await page
      .getByRole("link", { name: text.studentPortfolioLink, exact: true })
      .click();
    const reasons = page
      .getByRole("main")
      .locator("section")
      .filter({
        has: page.getByRole("heading", { level: 2, name: text.reasonsTitle }),
      });
    await expect(reasons.locator("li")).toHaveCount(1);
    await expectTexts(reasons.locator("li"), [
      text.purchaseOfOneLot,
      widestReason,
    ]);
    await expect(reasons).not.toContainText(text.reasonLabel);
    await expectAccessibleScreen(page);
    await student.context().close();
  });

  test(`shows the delayed price of the chosen stock and the price that the latest update missed, and offers no order of a stock without a price, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await openOrdersOfNewStudent(
      page,
      browser,
      locale,
    );
    const placeButton = student
      .getByRole("main")
      .getByRole("button", { name: text.labels.place });
    await chooseStock(student, locale, "ITMG");
    await expectChosenPrice(student, locale, "ITMG");
    await expect(placeButton).toBeVisible();
    await expectAccessibleScreen(student);

    await chooseAnotherStock(student, locale, "UNVR");
    await expectChosenPrice(student, locale, "UNVR");
    await expectTexts(
      student.getByRole("main").getByText(text.staleNotice[0]),
      text.staleNotice,
    );
    await expect(placeButton).toBeVisible();
    await expectAccessibleScreen(student);

    await chooseAnotherStock(student, locale, "WIFI");
    await expectChosenStock(student, locale, "WIFI");
    await expect(orderTicket(student, locale).locator("dl")).toHaveCount(0);
    await expectTexts(
      student.getByRole("main").getByText(text.missingNotice[0]),
      text.missingNotice,
    );
    await expectTexts(student.getByRole("main"), [text.noPriceOrder]);
    await expect(placeButton).toHaveCount(0);
    await expectAccessibleScreen(student);

    // An address with a stock that Portolab does not trade, as long as any field takes, shows the field that chooses a stock with the reason that quotes it.
    const widestCode = wideWord("X", fieldMaximumLength);
    const answer = await student.goto(`${classPath}/orders?code=${widestCode}`);
    expect(answer?.status()).toBe(400);
    await expect(
      student.getByText(
        `${text.unknownStock[0]}${widestCode}${text.unknownStock[1]}`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      student.getByRole("main").getByLabel(text.labels.stock, { exact: true }),
    ).toHaveAttribute("aria-invalid", "true");
    await expectAccessibleScreen(student);
    await student.context().close();
  });

  test(`answers a lecturer and a student who is not in the class at the address of the orders as at an address that does not exist, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student, classPath } = await openOrdersOfNewStudent(
      page,
      browser,
      locale,
    );
    for (const [reader, path] of [
      [page, `${classPath}/orders`],
      [student, "/classes/999999999/orders"],
    ] as const) {
      await expectMissingPage(reader, path, text.notFoundTitle);
    }
    await student.context().close();
  });

  test.describe(`before JavaScript loads in ${language}`, () => {
    // Axe runs in the page, so the screens are checked in the tests with JavaScript, and this test checks that each form works without it.
    test.use({ javaScriptEnabled: false });

    test("chooses a stock, keeps it after a refused order, takes the step of a rejection with the reason of the order, and places an order of it with its reason", async ({
      page,
      browser,
    }) => {
      // The lecturer uses a device of their own, so the page of the test, which runs no JavaScript, is the student.
      const { lecturer, testClass } = await studentOnNewClass(page, browser, {
        locale,
        ...widestClassNames,
      });
      await page.goto(`${testClass.path}/orders`);
      await chooseStock(page, locale, "BBCA");
      await expectChosenPrice(page, locale, "BBCA");
      await placeOrder(page, locale, { side: "buy" });
      await expectTexts(page.getByRole("main"), [text.emptyLots]);
      await expect(page).toHaveURL(/\/orders\?code=BBCA$/);
      await expectChosenPrice(page, locale, "BBCA");
      storeTestHolding(testClass.id, smallHolding);
      // A reason of two paragraphs, whose line break the browser sends as a carriage return and a line feed, in the order form and in the form of the step.
      const reason = "Bank besar dengan laba stabil.\n\nBeta di bawah 1.";
      await placeOrder(page, locale, { side: "buy", lots: "5", reason });
      await page
        .getByRole("alert")
        .getByRole("button", { name: text.purchaseStep })
        .click();
      await expect(
        page.getByRole("main").getByLabel(text.labels.lots, { exact: true }),
      ).toHaveValue("4");
      await expect(
        page.getByRole("main").getByLabel(text.labels.reason, { exact: true }),
      ).toHaveValue(reason);
      await page
        .getByRole("main")
        .getByRole("button", { name: text.labels.place })
        .click();
      await expect(page).toHaveURL(/\/orders\?placed=\d+$/);
      await expect(page.getByRole("status")).toHaveText(text.placed);
      await expect(
        page.getByText(`${text.reasonLabel}${reason}`, { exact: true }),
      ).toBeVisible();
      await lecturer.context().close();
    });
  });
}
