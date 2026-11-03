import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseOrderLots } from "./parse-order-lots";

// The field is named by the label that the reader sees, which the order form of each language passes as the source.
const labels: Record<Locale, string> = { id: "Jumlah lot", en: "Lots" };

// A count as formatNumber writes it in each language, the same digits in the groups of the other language, which read as a fraction there, and digits that the separator of the language splits into a group that is not of three.
const writtenCounts: Record<
  Locale,
  {
    grouped: string;
    otherGroups: string;
    brokenGroups: string;
    decimalBeyondCount: string;
  }
> = {
  id: {
    grouped: "50.000",
    otherGroups: "50,000",
    brokenGroups: "5.0000",
    decimalBeyondCount: "90071992547409920,5",
  },
  en: {
    grouped: "50,000",
    otherGroups: "50.000",
    brokenGroups: "5,0000",
    decimalBeyondCount: "90071992547409920.5",
  },
};

const failures: Record<
  Locale,
  {
    notWhole: string;
    exponent: string;
    otherGroups: string;
    brokenGroups: string;
    decimalBeyondCount: string;
    zero: string;
    beyondCount: string;
    empty: string;
  }
> = {
  id: {
    notWhole:
      'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot paling sedikit 1, misalnya 1.000, tetapi isinya "2,5". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    exponent:
      'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot paling sedikit 1, misalnya 1.000, tetapi isinya "1e3". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    otherGroups:
      'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot paling sedikit 1, misalnya 1.000, tetapi isinya "50,000". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    brokenGroups:
      'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot paling sedikit 1, misalnya 1.000, tetapi isinya "5.0000". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    decimalBeyondCount:
      'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot paling sedikit 1, misalnya 1.000, tetapi isinya "90071992547409920,5". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    zero: 'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot paling sedikit 1, misalnya 1.000, tetapi isinya "0". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    beyondCount:
      'Kolom "Jumlah lot" memuat paling banyak 9.007.199.254.740.991 lot, jumlah terbesar yang dapat dihitung Portolab, tetapi isinya "9007199254740992". Masukkan jumlah lot order ini.',
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    notWhole:
      'The field "Lots" takes a whole number of lots of at least 1, such as 1,000, but it holds "2,5". Write the number in digits, with or without "," between groups of digits as the example shows.',
    exponent:
      'The field "Lots" takes a whole number of lots of at least 1, such as 1,000, but it holds "1e3". Write the number in digits, with or without "," between groups of digits as the example shows.',
    otherGroups:
      'The field "Lots" takes a whole number of lots of at least 1, such as 1,000, but it holds "50.000". Write the number in digits, with or without "," between groups of digits as the example shows.',
    brokenGroups:
      'The field "Lots" takes a whole number of lots of at least 1, such as 1,000, but it holds "5,0000". Write the number in digits, with or without "," between groups of digits as the example shows.',
    decimalBeyondCount:
      'The field "Lots" takes a whole number of lots of at least 1, such as 1,000, but it holds "90071992547409920.5". Write the number in digits, with or without "," between groups of digits as the example shows.',
    zero: 'The field "Lots" takes a whole number of lots of at least 1, such as 1,000, but it holds "0". Write the number in digits, with or without "," between groups of digits as the example shows.',
    beyondCount:
      'The field "Lots" holds at most 9,007,199,254,740,991 lots, the most that Portolab can count, but it holds "9007199254740992". Enter the number of lots of the order.',
    empty: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
  },
};

test("reads a whole number of lots from 1, written in digits with spaces around it", () => {
  expect(parseOrderLots("1", "Lots")).toEqual({ ok: true, value: 1 });
  expect(parseOrderLots(" 50000 ", "Lots")).toEqual({
    ok: true,
    value: 50_000,
  });
});

test("reads a number of lots beyond the largest order of IDX, because placeOrder applies the largest order of the trading day", () => {
  expect(parseOrderLots("50001", "Lots")).toEqual({
    ok: true,
    value: 50_001,
  });
});

test("reads the largest number of lots that Portolab counts", () => {
  expect(parseOrderLots("9007199254740991", "Lots")).toEqual({
    ok: true,
    value: Number.MAX_SAFE_INTEGER,
  });
});

for (const locale of locales) {
  const failure = failures[locale];
  const label = labels[locale];
  const language = languageNames[locale];
  const written = writtenCounts[locale];

  test(`reads a number of lots in the groups of digits that Portolab writes in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(written.grouped, label)).toEqual({
      ok: true,
      value: 50_000,
    });
  });

  test(`rejects a number of lots that is not whole, and names the field and the value without the spaces around it in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(" 2,5 ", label)).toEqual({
      ok: false,
      failure: failure.notWhole,
    });
    expect(parseOrderLots("1e3", label)).toEqual({
      ok: false,
      failure: failure.exponent,
    });
  });

  test(`rejects digits in the groups of the other language or in groups that are not of three in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(written.otherGroups, label)).toEqual({
      ok: false,
      failure: failure.otherGroups,
    });
    expect(parseOrderLots(written.brokenGroups, label)).toEqual({
      ok: false,
      failure: failure.brokenGroups,
    });
  });

  test(`rejects a decimal mark in a number with more digits than the largest count for its form before its count in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(written.decimalBeyondCount, label)).toEqual({
      ok: false,
      failure: failure.decimalBeyondCount,
    });
  });

  test(`rejects an order of 0 lots in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("0", label)).toEqual({
      ok: false,
      failure: failure.zero,
    });
  });

  test(`rejects a number of lots one beyond the largest that Portolab counts, and names that count, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("9007199254740992", label)).toEqual({
      ok: false,
      failure: failure.beyondCount,
    });
  });

  test(`rejects an empty number of lots with the failure of every field in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("  ", label)).toEqual({
      ok: false,
      failure: failure.empty,
    });
  });
}
