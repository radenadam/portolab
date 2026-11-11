import { expect, test } from "vitest";
import { formDataForTest } from "~/form-data-for-test";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { failureOf } from "~/result";
import {
  parseStockCode,
  readOrderForm,
  sideOptions,
} from "./order-form-fields";
import type { OrderFormFields } from "./order-form-fields";
import {
  duringSessionForTest,
  mondayTradingDayForTest,
} from "./orders-for-test";

const codes = ["BBCA", "TLKM"];
const { maximumLots } = mondayTradingDayForTest.rules;

// An exponent is no digit in either language, and a number with more digits than a whole number of rupiah holds is above every price that IDX accepts.
const notWholeInEveryLanguage = ["1e3", "Rp4980"];

// The labels are those that the reader sees, which the order form passes as the sources. A sentence that quotes what a field holds is the tuple of its parts before and after the value. Each language writes its decimal mark where the other writes a separator of digit groups.
const texts: Record<
  Locale,
  {
    labels: { stock: string; side: string; priceKind: string; limit: string };
    noStock: string;
    unknownStock: readonly [string, string];
    fileInSide: string;
    farTooLong: (field: string, length: string) => string;
    lengths: { justPast: string; farPast: string };
    lotsLabel: string;
    tooManyLots: readonly [string, string];
    noSide: string;
    unknownSide: readonly [string, string];
    noPriceKind: string;
    unknownPriceKind: readonly [string, string];
    limits: readonly (readonly [string, number])[];
    notWholeLimits: readonly string[];
    notWholeLimit: readonly [string, string];
    emptyLimit: string;
    emptyLots: string;
  }
> = {
  id: {
    labels: {
      stock: "Saham",
      side: "Beli atau jual",
      priceKind: "Jenis order",
      limit: "Harga limit",
    },
    noStock: 'Kolom "Saham" belum berisi saham. Pilih saham untuk order ini.',
    unknownStock: [
      'Alamat halaman ini menyebut "',
      '" sebagai saham, tetapi Portolab hanya memperdagangkan saham yang ada di daftar kolom "Saham". Pilih salah satunya.',
    ],
    fileInSide:
      'Formulir mengirim nilai bertipe File di kolom "Beli atau jual", bukan teks. Muat ulang halaman, lalu isi formulirnya lagi.',
    farTooLong: (field, length) =>
      `Kolom "${field}" berisi ${length} karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.`,
    lengths: { justPast: "8.001", farPast: "1.000.000" },
    lotsLabel: "Jumlah lot",
    tooManyLots: [
      'Kolom "Jumlah lot" menerima paling banyak 50.000 lot, yaitu order terbesar yang diterima BEI, tetapi isinya "',
      '". Pilih paling banyak 50.000 lot, dan perdagangkan lot selebihnya dalam order berikutnya.',
    ],
    noSide:
      'Kolom "Beli atau jual" belum berisi pilihan. Pilih "Beli" atau "Jual".',
    unknownSide: [
      'Formulir mengirim "',
      '" di kolom "Beli atau jual", tetapi kolom itu hanya menerima "Beli" atau "Jual". Muat ulang halaman, lalu pilih salah satunya.',
    ],
    noPriceKind:
      'Kolom "Jenis order" belum berisi pilihan. Pilih "Order harga pasar" atau "Order limit".',
    unknownPriceKind: [
      'Formulir mengirim "',
      '" di kolom "Jenis order", tetapi kolom itu hanya menerima "Order harga pasar" atau "Order limit". Muat ulang halaman, lalu pilih salah satunya.',
    ],
    limits: [
      ["4980", 4_980],
      [" 4.980 ", 4_980],
      ["24.900", 24_900],
      ["0", 0],
    ],
    notWholeLimits: [
      "4,980",
      "4.98",
      " 49,8 ",
      "4980,5",
      "1.000.000.000.000.000.000,5",
      "1.0000.000.000.000.000.000",
    ],
    notWholeLimit: [
      'Kolom "Harga limit" menerima harga dalam rupiah bulat, misalnya 1.000, tetapi isinya "',
      '". Tulis harganya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    ],
    emptyLimit:
      'Kolom "Harga limit" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
    emptyLots:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    labels: {
      stock: "Stock",
      side: "Buy or sell",
      priceKind: "Kind of order",
      limit: "Limit price",
    },
    noStock:
      'The field "Stock" holds no stock yet. Choose the stock of the order.',
    unknownStock: [
      'The address of this page names "',
      '" as the stock, but Portolab trades only the stocks in the list of the field "Stock". Choose one of them.',
    ],
    fileInSide:
      'The form sent a value of type File in the field "Buy or sell" instead of text. Reload the page and fill in the form again.',
    farTooLong: (field, length) =>
      `The field "${field}" has ${length} characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.`,
    lengths: { justPast: "8,001", farPast: "1,000,000" },
    lotsLabel: "Lots",
    tooManyLots: [
      'The field "Lots" takes at most 50,000 lots, the largest order that IDX accepts, but it holds "',
      '". Choose at most 50,000 lots, and trade more lots in further orders.',
    ],
    noSide:
      'The field "Buy or sell" holds no choice yet. Choose "Buy" or "Sell".',
    unknownSide: [
      'The form sent "',
      '" in the field "Buy or sell", but the field takes only "Buy" or "Sell". Reload the page and choose one of them.',
    ],
    noPriceKind:
      'The field "Kind of order" holds no choice yet. Choose "Market order" or "Limit order".',
    unknownPriceKind: [
      'The form sent "',
      '" in the field "Kind of order", but the field takes only "Market order" or "Limit order". Reload the page and choose one of them.',
    ],
    limits: [
      ["4980", 4_980],
      [" 4,980 ", 4_980],
      ["24,900", 24_900],
      ["0", 0],
    ],
    notWholeLimits: [
      "4.980",
      "4,98",
      " 49.8 ",
      "4980.5",
      "1,000,000,000,000,000,000.5",
      "1,0000,000,000,000,000,000",
    ],
    notWholeLimit: [
      'The field "Limit price" takes a price in whole rupiah, such as 1,000, but it holds "',
      '". Write the price in digits, with or without "," between groups of digits as the example shows.',
    ],
    emptyLimit:
      'The field "Limit price" is empty, but Portolab needs it. Fill it in.',
    emptyLots: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
  },
};

const order = { code: "BBCA", maximumLots, placedAt: duringSessionForTest };

// A limit purchase of 5 lots at Rp5,000, of which a test changes or leaves out a field.
const limitPurchase: Record<string, string> = {
  side: "buy",
  priceKind: "limit",
  lots: "5",
  limit: "5000",
};

/** The fields of the limit purchase without those that a test names, which the form does not send. */
function withoutFields(names: readonly string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(limitPurchase)) {
    if (!names.includes(name)) {
      fields[name] = value;
    }
  }
  return fields;
}

/** Reads an order form that sends the fields of a test. */
function readFields(
  fields: Record<string, string>,
): ReturnType<typeof readOrderForm> {
  return readOrderForm(formDataForTest(fields), order);
}

/** The reasons for the fields of an order form that sends the fields of a test, which is undefined when Portolab reads an order from it. */
function failuresOfForm(
  fields: Record<string, string>,
): OrderFormFields | undefined {
  return failureOf(readFields(fields));
}

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`reads a stock of the list of the field from the address, and rejects an address without a stock or with another stock, in ${language}`, () => {
    switchLocaleForTest(locale);
    const source = text.labels.stock;
    expect(parseStockCode("TLKM", source, codes)).toEqual({
      ok: true,
      value: "TLKM",
    });
    for (const missing of [null, ""]) {
      expect(parseStockCode(missing, source, codes), String(missing)).toEqual({
        ok: false,
        failure: text.noStock,
      });
    }
    for (const other of ["BREN", "bbca", " BBCA "]) {
      expect(parseStockCode(other, source, codes), other).toEqual({
        ok: false,
        failure: `${text.unknownStock[0]}${other.trim()}${text.unknownStock[1]}`,
      });
    }
  });

  test(`judges the stock of the address and each field of the order form at the length of the longest field by its own rule, and rejects it just past and far past that length before any other work, in ${language}`, () => {
    switchLocaleForTest(locale);
    const { labels } = text;
    const atLimit = "1".repeat(fieldMaximumLength);
    expect(parseStockCode(atLimit, labels.stock, codes)).toEqual({
      ok: false,
      failure: `${text.unknownStock[0]}${atLimit}${text.unknownStock[1]}`,
    });
    expect(
      readOrderForm(
        formDataForTest({
          side: atLimit,
          priceKind: "limit",
          lots: atLimit,
          limit: atLimit,
        }),
        order,
      ),
    ).toMatchObject({
      ok: false,
      failure: {
        sideFailure: `${text.unknownSide[0]}${atLimit}${text.unknownSide[1]}`,
        lotsFailure: `${text.tooManyLots[0]}${atLimit}${text.tooManyLots[1]}`,
        limitFailure: undefined,
      },
    });
    expect(
      readOrderForm(formDataForTest({ priceKind: atLimit }), order),
    ).toMatchObject({
      ok: false,
      failure: {
        priceKindFailure: `${text.unknownPriceKind[0]}${atLimit}${text.unknownPriceKind[1]}`,
      },
    });
    for (const [length, written] of [
      [fieldMaximumLength + 1, text.lengths.justPast],
      [1_000_000, text.lengths.farPast],
    ] as const) {
      const long = "1".repeat(length);
      expect(parseStockCode(long, labels.stock, codes)).toEqual({
        ok: false,
        failure: text.farTooLong(labels.stock, written),
      });
      expect(
        readOrderForm(
          formDataForTest({
            side: long,
            priceKind: "limit",
            lots: long,
            limit: long,
          }),
          order,
        ),
      ).toMatchObject({
        ok: false,
        failure: {
          sideFailure: text.farTooLong(labels.side, written),
          lotsFailure: text.farTooLong(text.lotsLabel, written),
          limitFailure: text.farTooLong(labels.limit, written),
        },
      });
      expect(
        readOrderForm(formDataForTest({ priceKind: long }), order),
      ).toMatchObject({
        ok: false,
        failure: {
          priceKindFailure: text.farTooLong(labels.priceKind, written),
        },
      });
    }
  });

  test(`reads the side and the kind of an order from their options, names the options when the field holds none of them, and rejects a file, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const option of sideOptions()) {
      expect(
        readFields({ ...limitPurchase, side: option.value }),
      ).toMatchObject({
        ok: true,
        value: { side: option.value },
      });
    }
    expect(failuresOfForm(withoutFields(["side", "priceKind"]))).toMatchObject({
      sideFailure: text.noSide,
      priceKindFailure: text.noPriceKind,
    });
    expect(
      failuresOfForm({ ...limitPurchase, side: "hold" })?.sideFailure,
    ).toBe(`${text.unknownSide[0]}hold${text.unknownSide[1]}`);
    const withFile = formDataForTest(limitPurchase);
    withFile.set("side", new File([], "buy"));
    expect(readOrderForm(withFile, order)).toMatchObject({
      ok: false,
      failure: { sideFailure: text.fileInSide },
    });
  });

  test(`reads a limit price in whole rupiah, in digits alone or in the groups of digits that Portolab writes in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const [written, price] of text.limits) {
      expect(
        readFields({ ...limitPurchase, limit: written }),
        written,
      ).toMatchObject({
        ok: true,
        value: { price: { kind: "limit", limit: price } },
      });
    }
  });

  test(`reads a limit price with more digits than a whole number of rupiah holds as the highest such amount, which the auto rejection limits reject, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      readFields({ ...limitPurchase, limit: "99999999999999999999" }),
    ).toMatchObject({
      ok: true,
      value: { price: { kind: "limit", limit: Number.MAX_SAFE_INTEGER } },
    });
  });

  test(`rejects a limit price that is not whole or has a separator where ${language} writes none, also with more digits than any price, and quotes it without the spaces around it`, () => {
    switchLocaleForTest(locale);
    for (const written of [
      ...notWholeInEveryLanguage,
      ...text.notWholeLimits,
    ]) {
      expect(
        failuresOfForm({ ...limitPurchase, limit: written })?.limitFailure,
        written,
      ).toBe(
        `${text.notWholeLimit[0]}${written.trim()}${text.notWholeLimit[1]}`,
      );
    }
  });

  test(`reads an order of the stock of the address from the form, and the limit price only of a limit order, in ${language}`, () => {
    switchLocaleForTest(locale);
    const fields = { side: "sell", lots: "5" };
    expect(
      readOrderForm(
        formDataForTest({ ...fields, priceKind: "market", limit: "lima ribu" }),
        order,
      ),
    ).toEqual({
      ok: true,
      value: {
        code: "BBCA",
        side: "sell",
        lots: 5,
        price: { kind: "market" },
        placedAt: duringSessionForTest,
      },
    });
    expect(
      readOrderForm(
        formDataForTest({ ...fields, priceKind: "limit", limit: "5000" }),
        order,
      ),
    ).toMatchObject({
      ok: true,
      value: { price: { kind: "limit", limit: 5_000 } },
    });
  });

  test(`gives the reason for each field of a form that it does not accept, with what each field holds, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      readOrderForm(formDataForTest({ priceKind: "limit", limit: " " }), order),
    ).toEqual({
      ok: false,
      failure: {
        side: "",
        priceKind: "limit",
        lots: "",
        limit: " ",
        sideFailure: text.noSide,
        priceKindFailure: undefined,
        lotsFailure: text.emptyLots,
        limitFailure: text.emptyLimit,
      },
    });
    // A form without a kind of order has no price to read, so its limit price gets no reason.
    expect(readOrderForm(formDataForTest({ limit: "x" }), order)).toMatchObject(
      {
        ok: false,
        failure: {
          priceKindFailure: text.noPriceKind,
          limitFailure: undefined,
        },
      },
    );
  });
}
