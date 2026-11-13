import { RouterContextProvider } from "react-router";
import { expect, test } from "vitest";
import { databaseContext } from "~/database/database.server";
import type { Database } from "~/database/database.server";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import { formDataForTest } from "~/form-data-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import { successValueForTest } from "~/success-value-for-test";
import { parseRecordId } from "~/value-parsers";
import { cancelFromForm, placeFromForm } from "./order-actions.server";
import type { SentOrderForm } from "./order-actions.server";
import {
  bbcaCloseOfFridayForTest,
  duringSessionForTest,
  endOfMondayForTest,
} from "./orders-for-test";
import { readPortfolio } from "./portfolio-store.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { studentWithQuotesForTest } from "./portfolios-for-test.server";

const classId = successValueForTest(
  parseRecordId<ClassId>("1", "classId"),
  "1 is an id",
);

const texts: Record<
  Locale,
  {
    missingOrder: string;
    endedOrder: string;
    noReferenceClose: string;
    outsideLimits: string;
    missingRules: string;
    noStock: string;
    unknownStock: string;
  }
> = {
  id: {
    missingOrder:
      "Portolab tidak menyimpan order tersebut di antara order Anda, sehingga tidak ada yang dibatalkan. Daftar di bawah menunjukkan setiap order yang masih terbuka dan dapat Anda batalkan.",
    endedOrder:
      "Order Anda atas 5 lot BBCA yang dipasang pada 2 Nov 2026, 10.00 WIB tidak lagi terbuka, sehingga Portolab tidak dapat membatalkannya. Daftar order sebelumnya di bawah menunjukkan bagaimana order itu berakhir.",
    noReferenceClose:
      "BEI menetapkan rentang harga order limit dari harga penutupan terakhir BBCA sebelum hari bursa order ini, tetapi Portolab belum memiliki harga penutupan final BBCA untuk 2 November 2026. Order limit dapat dipasang setelah pembaruan riwayat harga menyimpan harga penutupan itu, jika BBCA diperdagangkan pada 2 November 2026, atau setelah Portolab memiliki harga BBCA dari hari bursa order ini. Order harga pasar tidak membutuhkan limit.",
    outsideLimits:
      'Kolom "Harga limit" berisi "9.000", tetapi BEI menolak harga itu untuk BBCA pada 2 November 2026 karena batas auto rejection. Batas itu mengizinkan harga paling jauh 25% di atas dan 7% di bawah harga acuan Rp\u00a04.980, dan setiap ujung rentangnya adalah harga sah terdekat di dalam batas itu. BEI menetapkan harga acuan dari harga penutupan terakhir BBCA sebelum hari itu. Pilih harga dari Rp\u00a04.640 sampai Rp\u00a06.225.',
    missingRules:
      "Portolab belum dapat menerima order ini, karena aturan BEI untuk hari bursa order ini belum tercatat. Beri tahu dosen Anda agar aturan tersebut dapat ditambahkan.",
    noStock: 'Kolom "Saham" belum berisi saham. Pilih saham untuk order ini.',
    unknownStock:
      'Alamat halaman ini menyebut "BREN" sebagai saham, tetapi Portolab hanya memperdagangkan saham yang ada di daftar kolom "Saham". Pilih salah satunya.',
  },
  en: {
    missingOrder:
      "Portolab holds no such order among your orders, so it cancelled nothing. The list below shows each open order that you can cancel.",
    endedOrder:
      "Your order of 5 lots of BBCA placed on Nov 2, 2026, 10:00 AM WIB is no longer open, so Portolab cannot cancel it. Your past orders below show how it ended.",
    noReferenceClose:
      "IDX sets the range of prices of a limit order from the latest close of BBCA before the trading day of the order, but Portolab has no final close of BBCA for November 2, 2026 yet. A limit order becomes possible once an update of the price history stores that close, if BBCA traded on November 2, 2026, or once Portolab has a price of BBCA from the trading day of the order. A market order needs no limit.",
    outsideLimits:
      'The field "Limit price" holds "9,000", but IDX rejects that price for BBCA on November 2, 2026 by its auto rejection limits. They allow a price at most 25% above and 7% below the reference price of IDR\u00a04,980, and each end of the range is the nearest valid price inside those limits. IDX sets the reference price from the latest close of BBCA before that day. Choose a price from IDR\u00a04,640 to IDR\u00a06,225.',
    missingRules:
      "Portolab cannot take this order yet, because it has not recorded the rules of IDX for the trading day of the order. Tell your lecturer, so that the rules can be added.",
    noStock:
      'The field "Stock" holds no stock yet. Choose the stock of the order.',
    unknownStock:
      'The address of this page names "BREN" as the stock, but Portolab trades only the stocks in the list of the field "Stock". Choose one of them.',
  },
};

/** The context of the action of a student, with the database and the source of prices that the server hands to it. */
function contextForTest(database: Database): RouterContextProvider {
  const context = new RouterContextProvider();
  context.set(databaseContext, database);
  context.set(priceSourceContext, fixturePriceSource);
  return context;
}

/** A student with a portfolio in a class whose stored quote of BBCA is the close of Friday, and the form request of the student at a moment, from the orders whose address chose BBCA unless the test gives another stock as the address sends it. */
async function studentRequestForTest(): Promise<{
  database: Database;
  owner: PortfolioOwner;
  request: (
    fields: Record<string, string>,
    now: Date,
    chosenStock?: string | null,
  ) => SentOrderForm;
}> {
  const { database, owner } = await studentWithQuotesForTest(
    [bbcaCloseOfFridayForTest],
    new Date("2026-11-02T01:40:00Z"),
  );
  return {
    database,
    owner,
    request: (fields, now, chosenStock = "BBCA") => ({
      form: formDataForTest(fields),
      place: { classId, owner },
      now,
      chosenStock,
    }),
  };
}

const purchase = {
  side: "buy",
  priceKind: "market",
  lots: "5",
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`places an order with its reason and opens the orders with its number, then refuses to cancel it once it ended, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const { database, owner, request } = await studentRequestForTest();
    const context = contextForTest(database);
    const placed = placeFromForm(
      context,
      request(
        { ...purchase, reason: " Laba stabil.\r\n\r\nBeta di bawah 1. " },
        duringSessionForTest,
      ),
    );
    expect(placed).toBeInstanceOf(Response);
    const location =
      placed instanceof Response ? placed.headers.get("Location") : null;
    expect(location).toMatch(/^\/classes\/1\/orders\?placed=\d+$/);
    expect(readPortfolio(database, owner).orders).toMatchObject([
      { reason: "Laba stabil.\n\nBeta di bawah 1." },
    ]);
    const orderId = location?.split("=")[1] ?? "";
    expect(
      cancelFromForm(context, request({ cancel: orderId }, endOfMondayForTest)),
    ).toMatchObject({
      data: { cancelFailure: text.endedOrder },
      init: { status: 409 },
    });
  });

  test(`refuses to cancel an order that the portfolio does not hold, also for a number that the form sent broken, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const { database, request } = await studentRequestForTest();
    for (const cancel of ["999", "x"]) {
      expect(
        cancelFromForm(
          contextForTest(database),
          request({ cancel }, duringSessionForTest),
        ),
        cancel,
      ).toMatchObject({
        data: { cancelFailure: text.missingOrder },
        init: { status: 404 },
      });
    }
  });

  test(`puts a failure of the limit price at its field, a failure of data that Portolab lacks above the form with its status, and keeps what the student typed, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const { database, request } = await studentRequestForTest();
    const context = contextForTest(database);
    const limit = { ...purchase, priceKind: "limit", limit: " 9000 " };
    // Before the market opens on Monday, the reference price is the stored close of Friday, which the month-end closes of the test hold.
    expect(
      placeFromForm(
        context,
        request(
          { ...limit, limit: locale === "id" ? " 9.000 " : " 9,000 " },
          new Date("2026-11-02T01:50:00Z"),
        ),
      ),
    ).toMatchObject({
      data: {
        fields: {
          limit: locale === "id" ? " 9.000 " : " 9,000 ",
          limitFailure: text.outsideLimits,
        },
        rejection: undefined,
      },
      init: { status: 400 },
    });
    // On Tuesday 3 November 2026 before the market opens, no close of Monday is stored, and the quote is from Friday.
    expect(
      placeFromForm(context, request(limit, new Date("2026-11-03T01:50:00Z"))),
    ).toMatchObject({
      data: {
        fields: { side: "buy", limitFailure: undefined },
        rejection: { text: text.noReferenceClose, lotsStep: undefined },
      },
      init: { status: 503 },
    });
  });

  test(`refuses every order on a day that no calendar of IDX covers, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const { database, request } = await studentRequestForTest();
    expect(
      placeFromForm(
        contextForTest(database),
        request(purchase, new Date("2028-01-03T03:00:00Z")),
      ),
    ).toMatchObject({
      data: {
        fields: { side: "buy" },
        rejection: { text: text.missingRules, lotsStep: undefined },
      },
      init: { status: 503 },
    });
  });

  test(`refuses an order from an address that chooses no stock or a stock that Portolab does not trade, with the reason for the field that chooses a stock, in ${language}`, async () => {
    switchLocaleForTest(locale);
    const { database, request } = await studentRequestForTest();
    for (const [chosenStock, stockFailure] of [
      [null, text.noStock],
      ["BREN", text.unknownStock],
    ] as const) {
      expect(
        placeFromForm(
          contextForTest(database),
          request(purchase, duringSessionForTest, chosenStock),
        ),
        String(chosenStock),
      ).toMatchObject({
        data: {
          fields: undefined,
          rejection: undefined,
          stockFailure,
          cancelFailure: undefined,
        },
        init: { status: 400 },
      });
    }
  });
}

// The class of the test starts its students with Rp100,000,000, and the stored quote of BBCA is Rp4,980. A purchase of 200 lots costs Rp99,600,000 and a broker fee of Rp149,400, which together the cash pays for, while 201 lots cost Rp100,098,000 before the fee, as the multiplication shows by hand.
test("rejects a purchase that the cash cannot pay for with the largest purchase that it pays for as the step of the rejection, and no step for a sale of shares that the student does not hold", async () => {
  const { database, request } = await studentRequestForTest();
  const context = contextForTest(database);
  expect(
    placeFromForm(
      context,
      request({ ...purchase, lots: "300" }, duringSessionForTest),
    ),
  ).toMatchObject({
    data: { fields: { lots: "300" }, rejection: { lotsStep: 200 } },
    init: { status: 400 },
  });
  expect(
    placeFromForm(
      context,
      request({ ...purchase, side: "sell" }, duringSessionForTest),
    ),
  ).toMatchObject({
    data: { rejection: { lotsStep: undefined } },
    init: { status: 400 },
  });
});

test("changes the lots of the order form to those of the step of a rejection, keeps the other fields with the reason as the student wrote it, and places no order", async () => {
  const { database, owner, request } = await studentRequestForTest();
  expect(
    placeFromForm(
      contextForTest(database),
      request(
        { ...purchase, lots: "300", reason: " Laba stabil. ", lotsStep: "200" },
        duringSessionForTest,
      ),
    ),
  ).toMatchObject({
    data: {
      fields: {
        side: "buy",
        priceKind: "market",
        lots: "200",
        reason: " Laba stabil. ",
        lotsFailure: undefined,
      },
      rejection: undefined,
    },
    init: { status: 200 },
  });
  expect(readPortfolio(database, owner).orders).toEqual([]);
});
