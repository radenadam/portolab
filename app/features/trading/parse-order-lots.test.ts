import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { lots } from "~/units/lots";
import { parseOrderLots } from "./parse-order-lots";
import { idxRulesForTest } from "./rules-for-test";

// The largest order that the rules of IDX give for Monday 2 November 2026, which is 50,000 lots.
const { maximumLots } = idxRulesForTest("2026-11-02");

// The field is named by the label that the reader sees, which the order form of each language passes as the source.
const labels: Record<Locale, string> = { id: "Jumlah lot", en: "Lots" };

// A count as formatNumber writes it in each language, the same digits in the groups of the other language, which read as a fraction there, digits that the separator of the language splits into a group that is not of three, and the decimal mark of the language in a number with more digits than the largest order.
const writtenCounts: Record<
  Locale,
  {
    grouped: string;
    otherGroups: string;
    brokenGroups: string;
    decimalBeyondMaximum: string;
  }
> = {
  id: {
    grouped: "50.000",
    otherGroups: "50,000",
    brokenGroups: "5.0000",
    decimalBeyondMaximum: "500000,5",
  },
  en: {
    grouped: "50,000",
    otherGroups: "50.000",
    brokenGroups: "5,0000",
    decimalBeyondMaximum: "500000.5",
  },
};

const notWhole: Record<Locale, (value: string) => string> = {
  id: (value) =>
    `Kolom "Jumlah lot" menerima bilangan bulat jumlah lot, misalnya 1.000, tetapi isinya "${value}". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.`,
  en: (value) =>
    `The field "Lots" takes a whole number of lots, such as 1,000, but it holds "${value}". Write the number in digits, with or without "," between groups of digits as the example shows.`,
};

const failures: Record<
  Locale,
  {
    zero: string;
    tooMany: string;
    tooManyForOneLot: string;
    empty: string;
  }
> = {
  id: {
    zero: 'Kolom "Jumlah lot" perlu paling sedikit 1 lot, yaitu order terkecil, tetapi isinya "0". Masukkan paling sedikit 1 lot.',
    tooMany:
      'Kolom "Jumlah lot" memuat paling banyak 50.000 lot, yaitu order terbesar yang diterima BEI, tetapi isinya "99999999999999999". Masukkan paling banyak 50.000 lot, dan perdagangkan lot selebihnya dalam order berikutnya.',
    tooManyForOneLot:
      'Kolom "Jumlah lot" memuat paling banyak 1 lot, yaitu order terbesar yang diterima BEI, tetapi isinya "2". Masukkan paling banyak 1 lot, dan perdagangkan lot selebihnya dalam order berikutnya.',
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    zero: 'The field "Lots" needs at least 1 lot, the smallest order, but it holds "0". Enter at least 1 lot.',
    tooMany:
      'The field "Lots" holds at most 50,000 lots, the largest order that IDX accepts, but it holds "99999999999999999". Enter at most 50,000 lots, and trade more lots in further orders.',
    tooManyForOneLot:
      'The field "Lots" holds at most 1 lot, the largest order that IDX accepts, but it holds "2". Enter at most 1 lot, and trade more lots in further orders.',
    empty: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
  },
};

test("reads a whole number of lots from the smallest order to the largest, written in digits with spaces around it", () => {
  expect(parseOrderLots("1", "Lots", maximumLots)).toEqual({
    ok: true,
    value: 1,
  });
  expect(parseOrderLots(" 50000 ", "Lots", maximumLots)).toEqual({
    ok: true,
    value: 50_000,
  });
});

for (const locale of locales) {
  const failure = failures[locale];
  const label = labels[locale];
  const language = languageNames[locale];
  const written = writtenCounts[locale];

  test(`reads a number of lots in the groups of digits that Portolab writes in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(written.grouped, label, maximumLots)).toEqual({
      ok: true,
      value: 50_000,
    });
  });

  test(`rejects a number of lots that is not whole, and names the field and the value without the spaces around it in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(" 2,5 ", label, maximumLots)).toEqual({
      ok: false,
      failure: notWhole[locale]("2,5"),
    });
    expect(parseOrderLots("1e3", label, maximumLots)).toEqual({
      ok: false,
      failure: notWhole[locale]("1e3"),
    });
  });

  test(`rejects digits in the groups of the other language or in groups that are not of three in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const value of [written.otherGroups, written.brokenGroups]) {
      expect(parseOrderLots(value, label, maximumLots)).toEqual({
        ok: false,
        failure: notWhole[locale](value),
      });
    }
  });

  test(`rejects a decimal mark in a number with more digits than the largest order for its form before its count in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      parseOrderLots(written.decimalBeyondMaximum, label, maximumLots),
    ).toEqual({
      ok: false,
      failure: notWhole[locale](written.decimalBeyondMaximum),
    });
  });

  test(`rejects an order of 0 lots, and names the smallest order, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("0", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.zero,
    });
  });

  test(`rejects a number of lots beyond the largest order of the trading day, and names that order, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("99999999999999999", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.tooMany,
    });
    expect(parseOrderLots("50001", label, maximumLots)).toMatchObject({
      ok: false,
    });
  });

  test(`rejects a number of lots beyond a largest order of 1 lot, and names that order in the singular, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2", label, lots(1))).toEqual({
      ok: false,
      failure: failure.tooManyForOneLot,
    });
  });

  test(`rejects an empty number of lots with the failure of every field in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("  ", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.empty,
    });
  });
}
