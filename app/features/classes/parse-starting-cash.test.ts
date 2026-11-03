import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseStartingCash } from "./parse-starting-cash";

// Each language writes its decimal mark where the other writes a separator of digit groups, so both forms fail in both languages.
const notWholeInEveryLanguage = [
  "100 juta",
  "100 000 000",
  "100.000.000,00",
  "100,000,000.00",
];

const texts: Record<
  Locale,
  {
    label: string;
    accepted: readonly (readonly [string, number])[];
    misplaced: readonly string[];
    outside: readonly string[];
    notWhole: readonly [string, string];
    outOfRange: readonly [string, string];
  }
> = {
  // Intl puts a space that does not break between the symbol of the currency and the amount.
  id: {
    label: "Modal awal",
    accepted: [
      ["100.000.000", 100_000_000],
      ["100000000", 100_000_000],
      [" 100.000.000 ", 100_000_000],
      ["1.000.000", 1_000_000],
      ["00001000000", 1_000_000],
      ["1.000.000.000.000", 1_000_000_000_000],
    ],
    misplaced: [
      "50000000.00",
      "100.000.00",
      "10.0000.000",
      "1.00.000.000",
      ".100.000.000",
      "100.000.000.",
      "100..000.000",
    ],
    outside: ["999.999", "1.000.000.000.001", "99.999.999.999.999.999.999"],
    notWhole: [
      'Kolom "Modal awal" menerima bilangan bulat rupiah, misalnya 100.000.000, tetapi isinya "',
      '". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka seperti pada contoh.',
    ],
    outOfRange: [
      'Kolom "Modal awal" menerima Rp 1.000.000 sampai Rp 1.000.000.000.000, tetapi isinya "',
      '". Uang yang lebih sedikit hanya cukup untuk sedikit lot, dan batas atas menjaga setiap jumlah dalam sebuah kelas tetap tepat. Pilih jumlah di antara keduanya.',
    ],
  },
  en: {
    label: "Starting cash",
    accepted: [
      ["100,000,000", 100_000_000],
      ["100000000", 100_000_000],
      [" 100,000,000 ", 100_000_000],
      ["1,000,000", 1_000_000],
      ["00001000000", 1_000_000],
      ["1,000,000,000,000", 1_000_000_000_000],
    ],
    misplaced: [
      "50000000,00",
      "100,000,00",
      "10,0000,000",
      "1,00,000,000",
      ",100,000,000",
      "100,000,000,",
      "100,,000,000",
    ],
    outside: ["999,999", "1,000,000,000,001", "99,999,999,999,999,999,999"],
    notWhole: [
      'The field "Starting cash" takes a whole number of rupiah, such as 100,000,000, but it holds "',
      '". Write the amount in digits, with or without "," between groups of digits as the example shows.',
    ],
    outOfRange: [
      'The field "Starting cash" takes IDR 1,000,000 to IDR 1,000,000,000,000, but it holds "',
      '". Less cash buys too few lots for a portfolio, and the maximum keeps every sum in a class exact. Choose an amount between the two.',
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`reads a whole number of rupiah, with the separators of ${language} where it writes them`, () => {
    switchLocaleForTest(locale);
    for (const [written, amount] of text.accepted) {
      expect(parseStartingCash(written, text.label), written).toEqual({
        ok: true,
        value: amount,
      });
    }
  });

  test(`rejects an amount that is not a whole number, or has a separator where ${language} writes none`, () => {
    switchLocaleForTest(locale);
    for (const written of [...notWholeInEveryLanguage, ...text.misplaced]) {
      expect(parseStartingCash(written, text.label), written).toEqual({
        ok: false,
        failure: `${text.notWhole[0]}${written}${text.notWhole[1]}`,
      });
    }
  });

  test(`rejects an amount outside the limits in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const written of text.outside) {
      expect(parseStartingCash(written, text.label), written).toEqual({
        ok: false,
        failure: `${text.outOfRange[0]}${written}${text.outOfRange[1]}`,
      });
    }
  });
}
