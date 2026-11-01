import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { lots } from "~/units/lots";
import { parseOrderLots } from "./parse-order-lots";

// The largest order of IDX since Kep-00071/BEI/11-2013.
const maximumLots = lots(50_000);

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
      'Kolom "Jumlah lot" berisi "99999999999999999", padahal BEI menerima paling banyak 50.000 lot dalam satu order. Masukkan jumlah lot dari 1 sampai 50.000.',
    empty:
      'Kolom "Jumlah lot" kosong, padahal Portolab memerlukannya. Isi kolom itu.',
  },
  en: {
    notWhole:
      'The field "Lots" holds "2,5", but the number of lots must be a whole number from 1, such as 5. Enter the number of lots of the order.',
    zero: 'The field "Lots" holds "0", but the number of lots must be a whole number from 1, such as 5. Enter the number of lots of the order.',
    tooMany:
      'The field "Lots" holds "99999999999999999", but IDX accepts at most 50,000 lots in one order. Enter a number of lots from 1 to 50,000.',
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

  test(`rejects a number of lots that is not whole, and names the field and the value in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("2,5", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.notWhole,
    });
    expect(parseOrderLots("1e3", label, maximumLots)).toMatchObject({
      ok: false,
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

  test(`rejects an empty number of lots with the failure of every field in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseOrderLots("  ", label, maximumLots)).toEqual({
      ok: false,
      failure: failure.empty,
    });
  });
}
