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
  { grouped: string; otherGroups: string; brokenGroups: string }
> = {
  id: { grouped: "50.000", otherGroups: "50,000", brokenGroups: "5.0000" },
  en: { grouped: "50,000", otherGroups: "50.000", brokenGroups: "5,0000" },
};

const failures: Record<
  Locale,
  {
    notWhole: string;
    exponent: string;
    otherGroups: string;
    brokenGroups: string;
    zero: string;
    beyondCount: string;
    empty: string;
  }
> = {
  id: {
    notWhole:
      'Kolom "Jumlah lot" berisi "2,5", tetapi jumlah lot harus bilangan bulat paling sedikit 1 yang ditulis dengan angka, misalnya 1.000. Masukkan jumlah lot order ini.',
    exponent:
      'Kolom "Jumlah lot" berisi "1e3", tetapi jumlah lot harus bilangan bulat paling sedikit 1 yang ditulis dengan angka, misalnya 1.000. Masukkan jumlah lot order ini.',
    otherGroups:
      'Kolom "Jumlah lot" berisi "50,000", tetapi jumlah lot harus bilangan bulat paling sedikit 1 yang ditulis dengan angka, misalnya 1.000. Masukkan jumlah lot order ini.',
    brokenGroups:
      'Kolom "Jumlah lot" berisi "5.0000", tetapi jumlah lot harus bilangan bulat paling sedikit 1 yang ditulis dengan angka, misalnya 1.000. Masukkan jumlah lot order ini.',
    zero: 'Kolom "Jumlah lot" berisi "0", tetapi jumlah lot harus bilangan bulat paling sedikit 1 yang ditulis dengan angka, misalnya 1.000. Masukkan jumlah lot order ini.',
    beyondCount:
      'Kolom "Jumlah lot" berisi "9007199254740992", tetapi Portolab hanya dapat menghitung jumlah lot sampai 9.007.199.254.740.991. Masukkan jumlah lot order ini.',
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    notWhole:
      'The field "Lots" holds "2,5", but the number of lots must be a whole number of at least 1, written in digits, such as 1,000. Enter the number of lots of the order.',
    exponent:
      'The field "Lots" holds "1e3", but the number of lots must be a whole number of at least 1, written in digits, such as 1,000. Enter the number of lots of the order.',
    otherGroups:
      'The field "Lots" holds "50.000", but the number of lots must be a whole number of at least 1, written in digits, such as 1,000. Enter the number of lots of the order.',
    brokenGroups:
      'The field "Lots" holds "5,0000", but the number of lots must be a whole number of at least 1, written in digits, such as 1,000. Enter the number of lots of the order.',
    zero: 'The field "Lots" holds "0", but the number of lots must be a whole number of at least 1, written in digits, such as 1,000. Enter the number of lots of the order.',
    beyondCount:
      'The field "Lots" holds "9007199254740992", but Portolab counts lots only up to 9,007,199,254,740,991. Enter the number of lots of the order.',
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

  test(`rejects a number of lots that is not whole, and names the field and the value in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2,5", label)).toEqual({
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
