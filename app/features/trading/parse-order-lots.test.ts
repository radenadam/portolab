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

// An exponent is no digit in either language.
const notWholeInEveryLanguage = ["1e3"];

// Each language writes its decimal mark where the other writes a separator of digit groups. The field is named by the label that the reader sees, which the order form of each language passes as the source. A sentence that quotes what the field holds is the tuple of its parts before and after the value.
const texts: Record<
  Locale,
  {
    label: string;
    accepted: readonly (readonly [string, number])[];
    notWholeInputs: readonly string[];
    notWhole: readonly [string, string];
    tooManyInputs: readonly string[];
    tooMany: readonly [string, string];
    tooManyForOneLot: string;
    tooFew: readonly [string, string];
    empty: string;
  }
> = {
  id: {
    label: "Jumlah lot",
    accepted: [
      ["1", 1],
      [" 50000 ", 50_000],
      ["50.000", 50_000],
      ["5.000", 5_000],
      ["0001", 1],
    ],
    notWholeInputs: ["2,5", " 2,5 ", "50,000", "5.0000", "500000,5"],
    notWhole: [
      'Kolom "Jumlah lot" menerima bilangan bulat jumlah lot, misalnya 1.000, tetapi isinya "',
      '". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    ],
    tooManyInputs: ["50001", "50.001", "99999999999999999"],
    tooMany: [
      'Kolom "Jumlah lot" memuat paling banyak 50.000 lot, yaitu order terbesar yang diterima BEI, tetapi isinya "',
      '". Pilih paling banyak 50.000 lot, dan perdagangkan lot selebihnya dalam order berikutnya.',
    ],
    tooManyForOneLot:
      'Kolom "Jumlah lot" memuat paling banyak 1 lot, yaitu order terbesar yang diterima BEI, tetapi isinya "2". Pilih paling banyak 1 lot, dan perdagangkan lot selebihnya dalam order berikutnya.',
    tooFew: [
      'Kolom "Jumlah lot" perlu paling sedikit 1 lot, yaitu order terkecil, tetapi isinya "',
      '". Pilih paling sedikit 1 lot.',
    ],
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    label: "Lots",
    accepted: [
      ["1", 1],
      [" 50000 ", 50_000],
      ["50,000", 50_000],
      ["5,000", 5_000],
      ["0001", 1],
    ],
    notWholeInputs: ["2.5", " 2.5 ", "50.000", "5,0000", "500000.5"],
    notWhole: [
      'The field "Lots" takes a whole number of lots, such as 1,000, but it holds "',
      '". Write the number in digits, with or without "," between groups of digits as the example shows.',
    ],
    tooManyInputs: ["50001", "50,001", "99999999999999999"],
    tooMany: [
      'The field "Lots" holds at most 50,000 lots, the largest order that IDX accepts, but it holds "',
      '". Choose at most 50,000 lots, and trade more lots in further orders.',
    ],
    tooManyForOneLot:
      'The field "Lots" holds at most 1 lot, the largest order that IDX accepts, but it holds "2". Choose at most 1 lot, and trade more lots in further orders.',
    tooFew: [
      'The field "Lots" needs at least 1 lot, the smallest order, but it holds "',
      '". Choose at least 1 lot.',
    ],
    empty: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`reads a whole number of lots from the smallest order to the largest, in digits alone or in the groups of digits that Portolab writes in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const [written, count] of text.accepted) {
      expect(parseOrderLots(written, text.label, maximumLots), written).toEqual(
        { ok: true, value: count },
      );
    }
  });

  test(`rejects a number of lots that is not whole or has a separator where ${language} writes none, and quotes it without the spaces around it`, () => {
    switchLocaleForTest(locale);
    for (const written of [
      ...notWholeInEveryLanguage,
      ...text.notWholeInputs,
    ]) {
      expect(parseOrderLots(written, text.label, maximumLots), written).toEqual(
        {
          ok: false,
          failure: `${text.notWhole[0]}${written.trim()}${text.notWhole[1]}`,
        },
      );
    }
  });

  test(`rejects a number of lots beyond the largest order of the trading day, and names that order, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const written of text.tooManyInputs) {
      expect(parseOrderLots(written, text.label, maximumLots), written).toEqual(
        {
          ok: false,
          failure: `${text.tooMany[0]}${written}${text.tooMany[1]}`,
        },
      );
    }
  });

  test(`rejects a number of lots beyond a largest order of 1 lot, and names that order in the singular, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2", text.label, lots(1))).toEqual({
      ok: false,
      failure: text.tooManyForOneLot,
    });
  });

  test(`rejects an order of 0 lots, and names the smallest order, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const written of ["0", "000"]) {
      expect(parseOrderLots(written, text.label, maximumLots), written).toEqual(
        {
          ok: false,
          failure: `${text.tooFew[0]}${written}${text.tooFew[1]}`,
        },
      );
    }
  });

  test(`rejects an empty number of lots with the failure of every field in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("  ", text.label, maximumLots)).toEqual({
      ok: false,
      failure: text.empty,
    });
  });
}
