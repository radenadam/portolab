import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseOrderLots } from "./parse-order-lots";

// The field is named by the label that the reader sees, which the order form of each language passes as the source.
const labels: Record<Locale, string> = { id: "Jumlah lot", en: "Lots" };

const failures: Record<
  Locale,
  { notWhole: string; zero: string; tooMany: string; empty: string }
> = {
  id: {
    notWhole:
      'Kolom "Jumlah lot" berisi "2,5", tetapi jumlah lot harus bilangan bulat mulai dari 1, misalnya 5. Masukkan jumlah lot order ini.',
    zero: 'Kolom "Jumlah lot" berisi "0", tetapi jumlah lot harus bilangan bulat mulai dari 1, misalnya 5. Masukkan jumlah lot order ini.',
    tooMany:
      'Kolom "Jumlah lot" berisi "99999999999999999", jauh lebih banyak daripada lot yang diterima BEI dalam satu order. Masukkan jumlah lot yang lebih kecil.',
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    notWhole:
      'The field "Lots" holds "2,5", but the number of lots must be a whole number from 1, such as 5. Enter the number of lots of the order.',
    zero: 'The field "Lots" holds "0", but the number of lots must be a whole number from 1, such as 5. Enter the number of lots of the order.',
    tooMany:
      'The field "Lots" holds "99999999999999999", far more lots than IDX accepts in one order. Enter a smaller number of lots.',
    empty: 'The field "Lots" is empty, but Portolab needs it. Fill it in.',
  },
};

test("reads a whole number of lots from 1, written in digits with spaces around it", () => {
  expect(parseOrderLots("5", "Lots")).toEqual({ ok: true, value: 5 });
  expect(parseOrderLots(" 50000 ", "Lots")).toEqual({
    ok: true,
    value: 50_000,
  });
});

for (const locale of locales) {
  const failure = failures[locale];
  const label = labels[locale];
  const language = languageNames[locale];

  test(`rejects a number of lots that is not whole, and names the field and the value in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2,5", label)).toEqual({
      ok: false,
      failure: failure.notWhole,
    });
    expect(parseOrderLots("1e3", label)).toMatchObject({ ok: false });
  });

  test(`rejects an order of 0 lots in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("0", label)).toEqual({
      ok: false,
      failure: failure.zero,
    });
  });

  test(`rejects a whole number of lots beyond any order without calling it not whole in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("99999999999999999", label)).toEqual({
      ok: false,
      failure: failure.tooMany,
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
