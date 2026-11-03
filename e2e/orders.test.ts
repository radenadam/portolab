import { expect, test } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { nameMaximumLength } from "../app/features/accounts/account-limits.ts";
import { classNameMaximumLength } from "../app/features/classes/class-rules.ts";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { languageNames } from "../app/language-names.ts";
import { locales } from "../app/paraglide/runtime.js";
import type { Locale } from "../app/paraglide/runtime.js";
import { successValueForTest } from "../app/success-value-for-test.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { parseRecordId } from "../app/value-parsers.ts";
import { joinAsNewStudent, signInAsNewLecturer } from "./accounts.ts";
import { chooseLanguage } from "./choose-language.ts";
import { createTestClass } from "./create-test-class.ts";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { newDevice } from "./new-device.ts";
import { storeTestHolding } from "./store-test-holding.ts";
import { wideWord } from "./wide-word.ts";

// The server runs with the fixture price source, whose quotes are the closes of Friday 30 October 2026, which fixture-price-source.server.ts records. They are from no session of the trading day of an order that a test places, so every order waits. The global setup stores the month-end closes that give BBCA enough monthly returns and AADI too few. The class has the most starting cash that Portolab accepts, and the purchase has the largest order that IDX accepts at the highest price of the stocks that a student can buy, so the screens show their widest amounts. A text with a part that the test cannot know in advance, such as the time of an order, is the tuple of its other parts.
const className = wideWord("Kelas", classNameMaximumLength);
const lecturerName = wideWord("Dosen", nameMaximumLength);
const studentName = wideWord("Mahasiswa", nameMaximumLength);

// The fixture records GOTO at Rp24, at which the starting cash of Rp1,000,000,000,000 buys at most 416,042,602 lots with the broker fee of 0.15%, which costs Rp999,999,998,167 and leaves Rp1,833, as the decimal module of Python computed with ROUND_HALF_UP. It is the largest holding, in shares and in cost, that the cash of a class can buy at a price of the fixture.
const widestHolding = {
  cash: rupiah(1_833),
  code: "GOTO",
  shares: shares(41_604_260_200),
  cost: rupiah(999_999_998_167),
};

const texts: Record<
  Locale,
  {
    ordersLink: string;
    title: string;
    backLink: string;
    fillNotice: string;
    pricesLink: string;
    headings: readonly string[];
    startingCash: readonly string[];
    noHoldings: string;
    dayNotice: readonly [string, string, string, string];
    labels: {
      stock: string;
      buy: string;
      sell: string;
      limitOrder: string;
      lots: string;
      limit: string;
      place: string;
      cancel: string;
    };
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
  }
> = {
  id: {
    ordersLink: "Order Anda di kelas ini",
    title: `Order di ${className}`,
    backLink: `Kembali ke ${className}`,
    fillNotice:
      "Portolab mengeksekusi order pada harga tertunda dari Yahoo Finance, sekitar 10 menit di belakang BEI, yang tercatat pada sesi I atau sesi II hari bursa order tersebut. Karena itu, harga eksekusi dapat berbeda dari harga di bursa pada saat yang sama.",
    pricesLink: "Lihat harga tertunda saham",
    headings: [
      "Kas Anda",
      "Saham yang Anda pegang",
      "Pasang order",
      "Order yang masih terbuka",
      "Order sebelumnya",
    ],
    startingCash: [
      "Kas",
      "Rp\u00a01.000.000.000.000",
      "Disisihkan order beli yang masih terbuka",
      "Rp\u00a00",
      "Kas yang tersedia",
      "Rp\u00a01.000.000.000.000",
    ],
    noHoldings: "Anda belum memegang saham.",
    dayNotice: [
      "Order yang Anda pasang sekarang dapat tereksekusi pada harga tertunda yang tercatat pada sesi I atau sesi II tanggal ",
      ", mulai pukul ",
      " WIB, dan kedaluwarsa pada pukul ",
      " WIB jika belum tereksekusi.",
    ],
    labels: {
      stock: "Saham",
      buy: "Beli",
      sell: "Jual",
      limitOrder: "Order limit",
      lots: "Jumlah lot",
      limit: "Harga limit",
      place: "Pasang order",
      cancel: "Batalkan order ini",
    },
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
  },
  en: {
    ordersLink: "Your orders in this class",
    title: `Orders in ${className}`,
    backLink: `Back to ${className}`,
    fillNotice:
      "Portolab fills an order at a delayed price from Yahoo Finance, about 10 minutes behind IDX, that was quoted in session I or session II of the trading day of the order. So a fill can differ from the price on the exchange at the same moment.",
    pricesLink: "See the delayed prices of the stocks",
    headings: [
      "Your cash",
      "Your holdings",
      "Place an order",
      "Open orders",
      "Past orders",
    ],
    startingCash: [
      "Cash",
      "IDR\u00a01,000,000,000,000",
      "Set aside by open buy orders",
      "IDR\u00a00",
      "Available cash",
      "IDR\u00a01,000,000,000,000",
    ],
    noHoldings: "You hold no shares yet.",
    dayNotice: [
      "An order that you place now can fill at a delayed price quoted in session I or session II on ",
      ", from ",
      " WIB, and it expires at ",
      " WIB if it has not filled by then.",
    ],
    labels: {
      stock: "Stock",
      buy: "Buy",
      sell: "Sell",
      limitOrder: "Limit order",
      lots: "Lots",
      limit: "Limit price",
      place: "Place the order",
      cancel: "Cancel this order",
    },
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
  },
};

/** Creates a lecturer with a class and a student who joined it on a device of their own, and opens the orders of the student from the page of the class. Returns the page of the student and the class. */
async function openOrdersOfNewStudent(
  page: Page,
  browser: Browser,
  locale: Locale,
): Promise<{ student: Page; classId: ClassId; classPath: string }> {
  await chooseLanguage(page, locale);
  await signInAsNewLecturer(page, lecturerName);
  const testClass = await createTestClass(page, className);
  const student = await newDevice(browser, locale);
  await joinAsNewStudent(student, testClass.joinPath, studentName);
  await student.getByRole("link", { name: texts[locale].ordersLink }).click();
  await expect(student).toHaveURL(`${testClass.path}/orders`);
  const classId = successValueForTest(
    parseRecordId<ClassId>(testClass.path.split("/").at(-1), "classId"),
    "The address of the class ends in its id",
  );
  return { student, classId, classPath: testClass.path };
}

/** Fills the order form with the fields that a test gives and sends it. The form chooses a market order until the test chooses a limit order. */
async function placeOrder(
  page: Page,
  locale: Locale,
  order: {
    code?: string;
    side?: "buy" | "sell";
    isLimit?: boolean;
    lots?: string;
    limit?: string;
  },
): Promise<void> {
  const { labels } = texts[locale];
  const main = page.getByRole("main");
  if (order.code !== undefined) {
    await main
      .getByLabel(labels.stock, { exact: true })
      .selectOption(order.code);
  }
  if (order.side !== undefined) {
    await main.getByLabel(labels[order.side], { exact: true }).check();
  }
  if (order.isLimit === true) {
    await main.getByLabel(labels.limitOrder, { exact: true }).check();
  }
  await main.getByLabel(labels.lots, { exact: true }).fill(order.lots ?? "");
  await main.getByLabel(labels.limit, { exact: true }).fill(order.limit ?? "");
  await main.getByRole("button", { name: labels.place }).click();
}

/** Checks that the main part of a page shows each text. */
async function expectTexts(
  page: Page,
  shown: readonly string[],
): Promise<void> {
  const main = page.getByRole("main");
  for (const text of shown) {
    await expect(main).toContainText(text);
  }
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`places a market purchase, cancels it, and explains each order that Portolab refuses, in ${language}`, async ({
    page,
    browser,
  }) => {
    const { student } = await openOrdersOfNewStudent(page, browser, locale);
    await expect(student).toHaveTitle(`${text.title} | Portolab`);
    await expect(
      student.getByRole("heading", { level: 1, name: text.title }),
    ).toBeVisible();
    for (const heading of text.headings) {
      await expect(
        student.getByRole("heading", { level: 2, name: heading, exact: true }),
      ).toBeVisible();
    }
    await expect(
      student.getByRole("link", { name: text.backLink }),
    ).toBeVisible();
    await expect(
      student.getByRole("link", { name: text.pricesLink }),
    ).toHaveAttribute("href", "/prices");
    await expect(student.locator("main dl")).toHaveText(
      text.startingCash.join(""),
    );
    await expectTexts(student, [
      text.fillNotice,
      text.noHoldings,
      ...text.dayNotice,
      text.lotsHint,
      text.noOpenOrders,
      text.noPastOrders,
    ]);
    await expectAccessibleScreen(student);

    await placeOrder(student, locale, {});
    await expectTexts(student, [text.noStock, text.noSide, text.emptyLots]);
    await expectAccessibleScreen(student);

    await placeOrder(student, locale, { code: "AADI", side: "buy", lots: "1" });
    await expect(student.getByRole("alert")).toHaveText(text.tooFewReturns);
    await placeOrder(student, locale, {
      code: "BBCA",
      side: "sell",
      lots: "5",
    });
    await expect(student.getByRole("alert")).toHaveText(text.noShares);
    await placeOrder(student, locale, {
      code: "BBCA",
      side: "buy",
      isLimit: true,
      lots: "5",
      limit: text.typedLimit,
    });
    const alert = student.getByRole("alert");
    for (const part of text.noReferenceClose) {
      await expect(alert).toContainText(part);
    }
    await expect(
      student.getByRole("main").getByLabel(text.labels.limit, { exact: true }),
    ).toHaveValue(text.typedLimit);
    await expectAccessibleScreen(student);

    await student.reload();
    await placeOrder(student, locale, {
      code: "BBCA",
      side: "buy",
      lots: text.largestOrder,
    });
    await expect(student).toHaveURL(/\/orders\?placed=\d+$/);
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await expectTexts(student, [...text.purchase, ...text.cashWithPurchase]);
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
    await expectTexts(student, [text.noOpenOrders, ...text.startingCash]);
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
    await expectTexts(staleTab, [text.noOpenOrders]);
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
    await expectTexts(student, text.holding);
    await placeOrder(student, locale, {
      code: "GOTO",
      side: "sell",
      lots: text.largestOrder,
    });
    await expect(student.getByRole("status")).toHaveText(text.placed);
    await expectTexts(student, [...text.holding, ...text.sale]);
    await expectAccessibleScreen(student);
    await placeOrder(student, locale, { code: "BBCA", side: "buy", lots: "1" });
    await expect(student.getByRole("alert")).toHaveText(text.notEnoughCash);
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
      const answer = await reader.goto(path);
      expect(answer?.status()).toBe(404);
      await expect(reader).toHaveTitle(`${text.notFoundTitle} | Portolab`);
    }
    await student.context().close();
  });
}
