import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import type { PriceSource } from "~/features/market-data/price-source.server";
import {
  failingSourceForTest,
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import {
  halfMinuteAfterForTest,
  sessionStateForTest,
} from "~/features/market-data/schedule-states-for-test";
import { stockQuote } from "~/features/market-data/stock-quote";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { minutesAfter } from "~/time-units";
import type { OrdersAnswer } from "./order-actions.server";
import { orderDayOf } from "./order-form";
import type { OrderDay } from "./order-form";
import { blankOrderForm } from "./order-form-fields";
import { orderTradingDay } from "./order-trading-day";
import type { TradingDayFailure } from "./order-trading-day";
import {
  bbcaCloseOfFridayForTest,
  bbcaForTest,
  mondayTradingDayForTest,
} from "./orders-for-test";
import { PlaceOrderSection } from "./place-order-section";
import { readStockChoice } from "./read-stock-choice.server";
import type { StockChoice } from "./read-stock-choice.server";

const monday = succeed(orderDayOf(mondayTradingDayForTest));
// The updates of the quote job of each test end with an attempt at 10:00 WIB on Monday 2 November 2026, and the section is seen half a minute later.
const lastAttemptAt = new Date(sessionStateForTest.attemptedAt);
const moment = {
  now: halfMinuteAfterForTest(sessionStateForTest),
  delayMinutes: bbcaForTest.delayMinutes,
};

/** The section with the trading day of Monday, a stock that the address chose, and the answer of the action of a test, on the page of the orders of a class. The names of the classes of CSS modules carry a hash, so the markup leaves them out. */
function renderSection(
  choice: StockChoice,
  {
    day = monday,
    answer,
  }: {
    day?: Result<OrderDay, TradingDayFailure>;
    answer?: OrdersAnswer;
  } = {},
): string {
  return renderInRouterForTest(
    <PlaceOrderSection
      ticket={{ day, choice }}
      codes={["BBCA", "TLKM"]}
      pagePath="/classes/1/orders"
      moment={moment}
      answer={answer}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

/** An update of the quote job from a source of a test at a moment. */
interface UpdateForTest {
  source: PriceSource;
  at: Date;
}

/** What readStockChoice reads of the stock of an address after updates of the quote job, one after another. */
async function choiceAfter(
  address: string | null,
  updates: readonly UpdateForTest[],
): Promise<StockChoice> {
  const database = openDatabaseForTest();
  for (const update of updates) {
    await updateQuotesForTest(database, update.source, { at: update.at });
  }
  return readStockChoice(database, address);
}

// The close of BBCA of Friday 30 October 2026, which an update stores after the close, and an answer at 10:00 with the close of TLKM of that day and without BBCA.
const fridayUpdate: UpdateForTest = {
  source: sourceAnsweringForTest([bbcaCloseOfFridayForTest]),
  at: new Date("2026-10-30T09:20:00Z"),
};
const answerWithoutBbca: UpdateForTest = {
  source: sourceAnsweringForTest([
    stockQuote("TLKM", [1_980, 1_980], "2026-10-30T09:14:51Z"),
  ]),
  at: lastAttemptAt,
};

/** The updates after which BBCA has a stored quote that the latest attempt updated, missed alone, or missed with every price, or has no stored quote after an attempt that missed it or before the first attempt. */
const updatesForTest: Record<
  "updated" | "missed" | "failed" | "neverStored" | "none",
  readonly UpdateForTest[]
> = {
  updated: [{ ...fridayUpdate, at: lastAttemptAt }],
  missed: [fridayUpdate, answerWithoutBbca],
  // The wait after each failure has passed before the next one, so the third failure in a row comes at 10:00.
  failed: [
    fridayUpdate,
    ...[-3, -2, 0].map((minutes) => ({
      source: failingSourceForTest,
      at: minutesAfter(lastAttemptAt, minutes),
    })),
  ],
  neverStored: [answerWithoutBbca],
  none: [],
};

// An order placed at 16:00 WIB on Thursday 30 December 2027 trades on a day of 2028, which no calendar covers, and one placed at 10:00 WIB on Friday 30 October 2026 trades before the first recorded fee schedule.
const missingDayMoments: Record<TradingDayFailure["kind"], Date> = {
  missingRules: new Date("2027-12-30T09:00:00Z"),
  missingCosts: new Date("2026-10-30T03:00:00Z"),
};
const missingDayKinds = [
  "missingRules",
  "missingCosts",
] as const satisfies readonly TradingDayFailure["kind"][];

const texts: Record<
  Locale,
  {
    title: string;
    simulation: string;
    missingDay: Record<TradingDayFailure["kind"], string>;
    chooser: readonly string[];
    placeholder: string;
    noStock: string;
    unknownStock: string;
    placeButton: string;
    options: readonly string[];
    stock: string;
    quoteTerms: string;
    otherStockLink: string;
    tryAgain: string;
    staleNotice: string;
    failedNotice: string;
    missingNotice: string;
    firstPrices: string;
    noPriceOrder: string;
  }
> = {
  id: {
    title: "<h2>Pasang order</h2>",
    simulation:
      "<p>Simulasi. Tidak ada uang sungguhan dan tidak ada transaksi sungguhan.</p></section>",
    missingDay: {
      missingRules:
        "Portolab belum dapat menerima order saat ini, karena aturan BEI untuk hari bursa order yang Anda pasang sekarang belum tercatat. Beri tahu dosen Anda agar aturan tersebut dapat ditambahkan.",
      missingCosts:
        "Portolab belum dapat menerima order saat ini, karena tarif biaya broker atau pajak final atas penjualan untuk hari bursa order yang Anda pasang sekarang belum tercatat. Beri tahu dosen Anda agar tarif yang belum tercatat itu dapat ditambahkan.",
    },
    chooser: [
      ">Saham</label>",
      ">Anda dapat membeli saham LQ45 yang memiliki imbal hasil bulanan yang dibutuhkan ukuran portofolio, dan menjual saham yang Anda pegang.</p>",
      ">Tampilkan harganya</button>",
    ],
    placeholder: "Pilih saham",
    noStock: "belum berisi saham. Pilih saham untuk order ini.",
    unknownStock:
      "sebagai saham, tetapi Portolab hanya memperdagangkan saham yang ada di daftar kolom",
    placeButton: ">Pasang order</button>",
    options: [
      '<option value="BBCA">BBCA · Bank Central Asia Tbk</option>',
      '<option value="TLKM">TLKM · Telkom Indonesia (Persero) Tbk</option>',
    ],
    stock:
      '<div><div><span aria-hidden="true">BB</span><div><span>BBCA</span><span>Bank Central Asia Tbk</span><span>Keuangan</span></div></div></div>',
    quoteTerms:
      '<dl><dt>Harga tertunda</dt><dd>Rp 4.980</dd><dt>Perubahan dari harga penutupan sebelumnya</dt><dd><span aria-hidden="true">▲ </span>+0,81%</dd></dl><p>Harga tertunda sekitar 10 menit, tercatat pada 30 Okt 2026, 16.14 WIB.</p>',
    otherStockLink: ">Pilih saham lain</a>",
    tryAgain: "Portolab mencoba lagi",
    staleNotice:
      "Portolab tidak dapat memperbarui harga BBCA pada 2 Nov 2026, 10.00 WIB, jadi Portolab memakai harga terakhir BBCA yang tersimpan. Portolab mencoba lagi pada 2 Nov 2026, 10.01 WIB.",
    failedNotice:
      "Portolab tidak dapat memperbarui harga pada 2 Nov 2026, 10.00 WIB, jadi Portolab memakai harga terakhir yang tersimpan. Portolab mencoba lagi pada 2 Nov 2026, 10.04 WIB.",
    missingNotice:
      "Portolab belum memiliki harga BBCA, karena percobaan terakhir untuk mengambilnya pada 2 Nov 2026, 10.00 WIB gagal. Portolab mencoba lagi pada 2 Nov 2026, 10.01 WIB.",
    firstPrices:
      "Portolab sedang mengambil harga pertamanya. Muat ulang halaman ini sebentar lagi untuk melihatnya.",
    noPriceOrder:
      "Anda dapat memasang order BBCA setelah pembaruan harga berikutnya membawa harga tertunda BBCA.",
  },
  en: {
    title: "<h2>Place an order</h2>",
    simulation:
      "<p>Simulation. No real money and no real trades.</p></section>",
    missingDay: {
      missingRules:
        "Portolab cannot take an order now, because it has not recorded the rules of IDX for the trading day of an order that you place now. Tell your lecturer, so that the rules can be added.",
      missingCosts:
        "Portolab cannot take an order now, because it lacks a record of the broker fee or of the final tax on sales for the trading day of an order that you place now. Tell your lecturer, so that the missing rates can be added.",
    },
    chooser: [
      ">Stock</label>",
      ">You can buy a stock of the LQ45 that has the monthly returns that the measures of a portfolio need, and sell a stock that you hold.</p>",
      ">Show the price</button>",
    ],
    placeholder: "Choose a stock",
    noStock: "holds no stock yet. Choose the stock of the order.",
    unknownStock:
      "as the stock, but Portolab trades only the stocks in the list of the field",
    placeButton: ">Place the order</button>",
    options: [
      '<option value="BBCA">BBCA · Bank Central Asia Tbk</option>',
      '<option value="TLKM">TLKM · Telkom Indonesia (Persero) Tbk</option>',
    ],
    stock:
      '<div><div><span aria-hidden="true">BB</span><div><span>BBCA</span><span>Bank Central Asia Tbk</span><span>Financials</span></div></div></div>',
    quoteTerms:
      '<dl><dt>Delayed price</dt><dd>IDR 4,980</dd><dt>Change from the previous close</dt><dd><span aria-hidden="true">▲ </span>+0.81%</dd></dl><p>Delayed by about 10 minutes, quoted at Oct 30, 2026, 4:14 PM WIB.</p>',
    otherStockLink: ">Choose another stock</a>",
    tryAgain: "Portolab tries again",
    staleNotice:
      "Portolab could not update the price of BBCA at Nov 2, 2026, 10:00 AM WIB, so it uses the last price of BBCA that it stored. Portolab tries again at Nov 2, 2026, 10:01 AM WIB.",
    failedNotice:
      "Portolab could not update the prices at Nov 2, 2026, 10:00 AM WIB, so it uses the last prices that it stored. Portolab tries again at Nov 2, 2026, 10:04 AM WIB.",
    missingNotice:
      "Portolab has no price for BBCA yet, because its latest attempt to fetch it at Nov 2, 2026, 10:00 AM WIB failed. Portolab tries again at Nov 2, 2026, 10:01 AM WIB.",
    firstPrices:
      "Portolab is fetching its first prices now. Reload this page in a moment to see them.",
    noPriceOrder:
      "You can place an order of BBCA once the next update of prices brings a delayed price of BBCA.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`explains in place of the order form that Portolab cannot take an order now while the trading day of an order lacks the rules of IDX or the costs, in ${language}`, async () => {
    switchLocaleForTest(locale);
    for (const kind of missingDayKinds) {
      const day = orderTradingDay(
        missingDayMoments[kind],
        bbcaForTest.delayMinutes,
      );
      expect(day.ok ? undefined : day.failure.kind, kind).toBe(kind);
      if (!day.ok) {
        expect(renderSection(await choiceAfter(null, []), { day }), kind).toBe(
          `<section>${text.title}<p>${text.missingDay[kind]}</p>${text.simulation}`,
        );
      }
    }
  });

  test(`offers the stocks in a form that sends the chosen one in the address, before the stock and the order form, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const html = renderSection(await choiceAfter(null, updatesForTest.updated));
    for (const expected of [
      ...text.chooser,
      `<option value="" selected="">${text.placeholder}</option>`,
      'method="get"',
      ...text.options,
    ]) {
      expect(html).toContain(expected);
    }
    expect(html).not.toContain('aria-invalid="true"');
    expect(html).not.toContain(text.placeButton);
  });

  test(`shows the reason that the address chose no stock that Portolab trades at the field that chooses a stock, in ${language}`, async () => {
    switchLocaleForTest(locale);
    for (const [address, reason] of [
      ["", text.noStock],
      ["BREN", text.unknownStock],
    ] as const) {
      const html = renderSection(await choiceAfter(address, []));
      expect(html, address).toContain(reason);
      expect(html, address).toContain('aria-invalid="true"');
      expect(html, address).not.toContain(text.placeButton);
    }
  });

  test(`shows the latest delayed price of the chosen stock with its change and its time, a link to choose another stock, and the order form, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const html = renderSection(
      await choiceAfter("BBCA", updatesForTest.updated),
    );
    for (const expected of [
      `${text.stock}${text.quoteTerms}`,
      text.otherStockLink,
      'href="/classes/1/orders"',
      text.placeButton,
      'method="post"',
    ]) {
      expect(html).toContain(expected);
    }
    expect(html).not.toContain(text.chooser[0]);
    expect(html).not.toContain(text.tryAgain);
  });

  test(`says when the latest attempt could not update the price of the chosen stock, alone or with every price, and still offers the order form, in ${language}`, async () => {
    switchLocaleForTest(locale);
    for (const [updates, notice] of [
      [updatesForTest.missed, text.staleNotice],
      [updatesForTest.failed, text.failedNotice],
    ] as const) {
      const html = renderSection(await choiceAfter("BBCA", updates));
      expect(html).toContain(`${text.stock}${text.quoteTerms}`);
      expect(html).toContain(`>${notice}</p>`);
      expect(html).toContain(text.placeButton);
    }
  });

  test(`says why Portolab has no price of the chosen stock and when an order becomes possible, in place of the price and the order form, in ${language}`, async () => {
    switchLocaleForTest(locale);
    for (const [updates, notice] of [
      [updatesForTest.neverStored, text.missingNotice],
      [updatesForTest.none, text.firstPrices],
    ] as const) {
      const html = renderSection(await choiceAfter("BBCA", updates));
      for (const expected of [
        "<h2>",
        `${text.stock}<p>`,
        `>${notice}</p>`,
        `<p>${text.noPriceOrder}</p>`,
        text.otherStockLink,
        'href="/classes/1/orders"',
      ]) {
        expect(html).toContain(expected);
      }
      expect(html).not.toContain(text.placeButton);
    }
  });
}

test("shows the reason of the action at the field that chooses a stock, in place of the reason of the address", async () => {
  const html = renderSection(await choiceAfter(null, []), {
    answer: {
      fields: undefined,
      rejection: undefined,
      stockFailure: "The reason of the action.",
      cancelFailure: undefined,
    },
  });
  expect(html).toContain("The reason of the action.</p>");
  expect(html).toContain('aria-invalid="true"');
});

test("shows the order form of the chosen stock as the student sent it, with the reasons that the action gave", async () => {
  const html = renderSection(
    await choiceAfter("BBCA", updatesForTest.updated),
    {
      answer: {
        fields: {
          ...blankOrderForm,
          lots: "5",
          lotsFailure: "The reason of the lots.",
        },
        rejection: { text: "The reason of the order.", lotsStep: undefined },
        stockFailure: undefined,
        cancelFailure: undefined,
      },
    },
  );
  expect(html).toContain('value="5"');
  expect(html).toContain("The reason of the lots.</p>");
  expect(html).toContain("The reason of the order.</p>");
});
