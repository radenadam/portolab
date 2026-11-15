import { expect, test } from "vitest";
import { formatNumber } from "~/formatting";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import {
  marketChoiceLabel,
  marketDirectionOptions,
  parseMarketChoice,
  parseMarketSearch,
} from "./market-filters";

const texts: Record<
  Locale,
  {
    field: string;
    searchField: string;
    invalid: string;
    notText: string;
    far: string;
    maximum: string;
    noSelection: string;
    emptyChoice: string;
  }
> = {
  id: {
    noSelection: "Belum dipilih",
    emptyChoice:
      'Kolom "Urutan" berisi "Belum dipilih", yang bukan pilihan yang tersedia. Pilih Menurun atau Menaik, lalu terapkan lagi.',
    field: "Urutan",
    searchField: "Cari saham",
    invalid:
      'Kolom "Urutan" berisi "salah", yang bukan pilihan yang tersedia. Pilih Menurun atau Menaik, lalu terapkan lagi.',
    notText:
      'Formulir mengirim nilai bertipe number di kolom "Urutan", bukan teks. Muat ulang halaman, lalu isi formulirnya lagi.',
    far: 'Kolom "Urutan" berisi {count} karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    maximum:
      'Kolom "Cari saham" memuat paling banyak {maximum} karakter, tetapi isinya {count} karakter. Persingkat isinya.',
  },
  en: {
    noSelection: "No selection",
    emptyChoice:
      'The field "Order" holds "No selection", which is not an available choice. Choose Descending or Ascending, then apply again.',
    field: "Order",
    searchField: "Search stocks",
    invalid:
      'The field "Order" holds "salah", which is not an available choice. Choose Descending or Ascending, then apply again.',
    notText:
      'The form sent a value of type number in the field "Order" instead of text. Reload the page and fill in the form again.',
    far: 'The field "Order" has {count} characters, more than this field takes. Fill it in with the text that it asks for.',
    maximum:
      'The field "Search stocks" holds at most {maximum} characters, but it has {count}. Shorten it.',
  },
};
for (const locale of locales) {
  test(`names empty refused choices in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of ["", " \t "]) {
      expect(marketChoiceLabel(value)).toBe(texts[locale].noSelection);
      expect(
        parseMarketChoice(value, texts[locale].field, {
          options: marketDirectionOptions(),
          fallback: "descending",
        }),
      ).toEqual({ ok: false, failure: texts[locale].emptyChoice });
    }
    expect(marketChoiceLabel(" 42 ")).toBe(" 42 ");
  });
  test(`parses a search and a choice, and refuses an unknown choice with its visible field and options in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const options = {
      options: marketDirectionOptions(),
      fallback: "descending" as const,
    };
    expect(parseMarketSearch(null, texts[locale].field)).toEqual({
      ok: true,
      value: "",
    });
    expect(parseMarketChoice(null, texts[locale].field, options)).toEqual({
      ok: true,
      value: "descending",
    });
    expect(
      parseMarketChoice("ascending", texts[locale].field, options),
    ).toEqual({ ok: true, value: "ascending" });
    expect(parseMarketChoice(" salah ", texts[locale].field, options)).toEqual({
      ok: false,
      failure: texts[locale].invalid,
    });
    expect(parseMarketSearch(1, texts[locale].field)).toEqual({
      ok: false,
      failure: texts[locale].notText,
    });
  });
  test(`checks the size before normalizing a search or choice at, past, and far past the limit in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [source, maximum, failure] of [
      [texts[locale].field, "guard", texts[locale].far],
      [texts[locale].searchField, "field", texts[locale].maximum],
    ] as const) {
      expect(
        parseMarketSearch("x".repeat(fieldMaximumLength), source, maximum).ok,
      ).toBe(true);
      for (const length of [fieldMaximumLength + 1, fieldMaximumLength * 10]) {
        const result = {
          ok: false,
          failure: failure
            .replace("{count}", formatNumber(length))
            .replace("{maximum}", formatNumber(fieldMaximumLength)),
        };
        const value = " ".repeat(length);
        expect(parseMarketSearch(value, source, maximum)).toEqual(result);
        if (maximum === "guard")
          expect(
            parseMarketChoice(value, source, {
              options: marketDirectionOptions(),
              fallback: "descending",
            }),
          ).toEqual(result);
        else expect(parseMarketSearch(value, source)).toEqual(result);
      }
    }
  });
}
