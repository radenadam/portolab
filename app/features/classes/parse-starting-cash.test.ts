import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseStartingCash } from "./parse-starting-cash";

const texts: Record<
  Locale,
  {
    label: string;
    written: readonly string[];
    small: string;
    notWhole: string;
    outOfRange: string;
  }
> = {
  // Intl puts a space that does not break between the symbol of the currency and the amount.
  id: {
    label: "Modal awal",
    written: ["100.000.000", "100000000", " 100 000 000 "],
    small: "999.999",
    notWhole:
      'Kolom "Modal awal" menerima bilangan bulat rupiah, misalnya 100.000.000, tetapi isinya "100 juta". Tulis jumlahnya dengan angka, dengan atau tanpa "." di antara kelompok angka.',
    outOfRange:
      'Kolom "Modal awal" menerima Rp 1.000.000 sampai Rp 1.000.000.000.000, tetapi isinya "999.999". Uang yang lebih sedikit hanya cukup untuk sedikit lot, dan Portolab menjaga jumlah dalam sebuah kelas tetap tepat hanya sampai batas atas. Pilih jumlah di antara keduanya.',
  },
  en: {
    label: "Starting cash",
    written: ["100,000,000", "100000000", " 100 000 000 "],
    small: "999,999",
    notWhole:
      'The field "Starting cash" takes a whole number of rupiah, such as 100,000,000, but it holds "100 juta". Write the amount in digits, with or without "," between groups of digits.',
    outOfRange:
      'The field "Starting cash" takes from IDR 1,000,000 to IDR 1,000,000,000,000, but it holds "999,999". Less cash buys too few lots for a portfolio, and Portolab keeps the sums of a class exact only up to the maximum. Choose an amount between the two.',
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`reads a whole number of rupiah with the separators of ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const written of text.written) {
      expect(parseStartingCash(written, text.label), written).toEqual({
        ok: true,
        value: 100_000_000,
      });
    }
  });

  test(`rejects an amount that is not a whole number, or outside the limits, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parseStartingCash("100 juta", text.label)).toEqual({
      ok: false,
      failure: text.notWhole,
    });
    expect(parseStartingCash(text.small, text.label)).toEqual({
      ok: false,
      failure: text.outOfRange,
    });
  });
}
