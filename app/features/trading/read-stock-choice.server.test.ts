import { expect, test } from "vitest";
import { openDatabaseForTest } from "~/database/open-database-for-test.server";
import {
  sourceAnsweringForTest,
  updateQuotesForTest,
} from "~/features/market-data/quote-updates-for-test.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { bbcaCloseOfFridayForTest } from "./orders-for-test";
import { readStockChoice } from "./read-stock-choice.server";

// 16:20 WIB on Friday 30 October 2026, after the close.
const afterClose = new Date("2026-10-30T09:20:00Z");

const failures: Record<Locale, { noStock: string; unknownStock: string }> = {
  id: {
    noStock: 'Kolom "Saham" belum berisi saham. Pilih saham untuk order ini.',
    unknownStock:
      'Alamat halaman ini menyebut "BREN" sebagai saham, tetapi Portolab hanya memperdagangkan saham yang ada di daftar kolom "Saham". Pilih salah satunya.',
  },
  en: {
    noStock:
      'The field "Stock" holds no stock yet. Choose the stock of the order.',
    unknownStock:
      'The address of this page names "BREN" as the stock, but Portolab trades only the stocks in the list of the field "Stock". Choose one of them.',
  },
};

test("reads the latest quote of the stock of the address, with the latest attempt narrowed to it, whether Portolab stored a quote of it or not", async () => {
  const database = openDatabaseForTest();
  await updateQuotesForTest(
    database,
    sourceAnsweringForTest([bbcaCloseOfFridayForTest]),
    { at: afterClose },
  );
  expect(readStockChoice(database, "BBCA")).toEqual({
    kind: "chosen",
    code: "BBCA",
    quote: bbcaCloseOfFridayForTest,
    quoteAttempt: {
      attemptedAt: afterClose,
      succeeded: true,
      consecutiveFailures: 0,
      failedCodes: [],
    },
  });
  expect(readStockChoice(database, "TLKM")).toEqual({
    kind: "chosen",
    code: "TLKM",
    quote: undefined,
    quoteAttempt: {
      attemptedAt: afterClose,
      succeeded: true,
      consecutiveFailures: 0,
      failedCodes: ["TLKM"],
    },
  });
});

test("reads a stock without an attempt of the quote job before the job made one", () => {
  expect(readStockChoice(openDatabaseForTest(), "BBCA")).toEqual({
    kind: "chosen",
    code: "BBCA",
    quote: undefined,
    quoteAttempt: undefined,
  });
});

for (const locale of locales) {
  test(`offers the field that chooses a stock to an address without a stock, and gives the reason for an address with an empty stock or a stock that Portolab does not trade, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const database = openDatabaseForTest();
    expect(readStockChoice(database, null)).toEqual({
      kind: "choosing",
      failure: undefined,
    });
    expect(readStockChoice(database, "")).toEqual({
      kind: "choosing",
      failure: failures[locale].noStock,
    });
    expect(readStockChoice(database, "BREN")).toEqual({
      kind: "choosing",
      failure: failures[locale].unknownStock,
    });
  });
}
