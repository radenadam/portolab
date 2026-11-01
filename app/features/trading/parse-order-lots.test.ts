import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseOrderLots } from "./parse-order-lots";

const failures: Record<
  Locale,
  { notWhole: string; zero: string; missing: string; notText: string }
> = {
  id: {
    notWhole:
      'Formulir mengirim "2,5" di kolom lots, tetapi jumlah lot harus bilangan bulat mulai dari 1, misalnya 5. Masukkan jumlah lot order ini.',
    zero: 'Formulir mengirim "0" di kolom lots, tetapi jumlah lot harus bilangan bulat mulai dari 1, misalnya 5. Masukkan jumlah lot order ini.',
    missing:
      "Formulir tidak mengirim jumlah lot di kolom lots. Masukkan jumlah lot order ini, berupa bilangan bulat mulai dari 1.",
    notText:
      "Formulir mengirim nilai bertipe File di kolom lots, bukan teks. Masukkan jumlah lot order ini, berupa bilangan bulat mulai dari 1.",
  },
  en: {
    notWhole:
      'The form sent "2,5" in the field lots, but the number of lots must be a whole number from 1, such as 5. Enter the number of lots of the order.',
    zero: 'The form sent "0" in the field lots, but the number of lots must be a whole number from 1, such as 5. Enter the number of lots of the order.',
    missing:
      "The form sent no number of lots in the field lots. Enter the number of lots of the order, a whole number from 1.",
    notText:
      "The form sent a value of type File in the field lots instead of text. Enter the number of lots of the order, a whole number from 1.",
  },
};

test("reads a whole number of lots from 1, written in digits with spaces around it", () => {
  expect(parseOrderLots("5", "lots")).toEqual({ ok: true, value: 5 });
  expect(parseOrderLots(" 50000 ", "lots")).toEqual({
    ok: true,
    value: 50_000,
  });
});

for (const locale of locales) {
  const failure = failures[locale];
  const language = languageNames[locale];

  test(`rejects a number of lots that is not whole, and names the field and the value in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2,5", "lots")).toEqual({
      ok: false,
      failure: failure.notWhole,
    });
    expect(parseOrderLots("1e3", "lots")).toMatchObject({ ok: false });
  });

  test(`rejects an order of 0 lots in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("0", "lots")).toEqual({
      ok: false,
      failure: failure.zero,
    });
  });

  test(`rejects a missing number of lots in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(null, "lots")).toEqual({
      ok: false,
      failure: failure.missing,
    });
  });

  test(`rejects a field that holds a file instead of text in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots(new File([], "lots.txt"), "lots")).toEqual({
      ok: false,
      failure: failure.notText,
    });
  });
}
