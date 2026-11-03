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
    tooMany: string;
    beyondOneLot: string;
    empty: string;
  }
> = {
  id: {
    notWhole:
      'Kolom "Jumlah lot" berisi "2,5", tetapi jumlah lot harus bilangan bulat mulai dari 1 yang ditulis dengan angka, misalnya 5 atau 1.000. Masukkan jumlah lot order ini.',
    exponent:
      'Kolom "Jumlah lot" berisi "1e3", tetapi jumlah lot harus bilangan bulat mulai dari 1 yang ditulis dengan angka, misalnya 5 atau 1.000. Masukkan jumlah lot order ini.',
    otherGroups:
      'Kolom "Jumlah lot" berisi "50,000", tetapi jumlah lot harus bilangan bulat mulai dari 1 yang ditulis dengan angka, misalnya 5 atau 1.000. Masukkan jumlah lot order ini.',
    brokenGroups:
      'Kolom "Jumlah lot" berisi "5.0000", tetapi jumlah lot harus bilangan bulat mulai dari 1 yang ditulis dengan angka, misalnya 5 atau 1.000. Masukkan jumlah lot order ini.',
    zero: 'Kolom "Jumlah lot" berisi "0", tetapi jumlah lot harus bilangan bulat mulai dari 1 yang ditulis dengan angka, misalnya 5 atau 1.000. Masukkan jumlah lot order ini.',
    tooMany:
      'Kolom "Jumlah lot" berisi "99999999999999999", padahal BEI menerima paling banyak 50.000 lot dalam satu order. Masukkan paling banyak 50.000 lot.',
    beyondOneLot:
      'Kolom "Jumlah lot" berisi "2", padahal BEI menerima paling banyak 1 lot dalam satu order. Masukkan paling banyak 1 lot.',
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    notWhole:
      'The field "Lots" holds "2,5", but the number of lots must be a whole number from 1 written in digits, such as 5 or 1,000. Enter the number of lots of the order.',
    exponent:
      'The field "Lots" holds "1e3", but the number of lots must be a whole number from 1 written in digits, such as 5 or 1,000. Enter the number of lots of the order.',
    otherGroups:
      'The field "Lots" holds "50.000", but the number of lots must be a whole number from 1 written in digits, such as 5 or 1,000. Enter the number of lots of the order.',
    brokenGroups:
      'The field "Lots" holds "5,0000", but the number of lots must be a whole number from 1 written in digits, such as 5 or 1,000. Enter the number of lots of the order.',
    zero: 'The field "Lots" holds "0", but the number of lots must be a whole number from 1 written in digits, such as 5 or 1,000. Enter the number of lots of the order.',
    tooMany:
      'The field "Lots" holds "99999999999999999", but IDX accepts at most 50,000 lots in one order. Enter at most 50,000 lots.',
    beyondOneLot:
      'The field "Lots" holds "2", but IDX accepts at most 1 lot in one order. Enter at most 1 lot.',
    empty: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
  },
};

test("reads a whole number of lots from 1, written in digits with spaces around it", () => {
  expect(parseOrderLots("5", "Lots", maximumLots)).toEqual({
    ok: true,
    value: 5,
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

  test(`rejects a number of lots that is not whole, and names the field and the value in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2,5", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.notWhole,
    });
    expect(parseOrderLots("1e3", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.exponent,
    });
  });

  test(`rejects digits in the groups of the other language or in groups that are not of three in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(written.otherGroups, label, maximumLots)).toEqual({
      ok: false,
      failure: failure.otherGroups,
    });
    expect(parseOrderLots(written.brokenGroups, label, maximumLots)).toEqual({
      ok: false,
      failure: failure.brokenGroups,
    });
  });

  test(`rejects an order of 0 lots in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("0", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.zero,
    });
  });

  test(`rejects a whole number of lots beyond the largest order, and names that order, in ${language}`, () => {
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
      failure: failure.beyondOneLot,
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
