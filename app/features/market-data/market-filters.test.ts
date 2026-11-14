import { expect, test } from "vitest";
import { formatNumber } from "~/formatting";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import {
  marketDirectionOptions,
  parseMarketChoice,
  parseMarketSearch,
} from "./market-filters";

const texts: Record<
  Locale,
  { field: string; invalid: string; notText: string; far: string }
> = {
  id: {
    field: "Urutan",
    invalid:
      'Kolom "Urutan" berisi "salah", yang bukan pilihan yang tersedia. Pilih Menurun atau Menaik, lalu terapkan lagi.',
    notText:
      'Formulir mengirim nilai bertipe number di kolom "Urutan", bukan teks. Muat ulang halaman, lalu isi formulirnya lagi.',
    far: 'Kolom "Urutan" berisi {count} karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
  },
  en: {
    field: "Order",
    invalid:
      'The field "Order" holds "salah", which is not an available choice. Choose Descending or Ascending, then apply again.',
    notText:
      'The form sent a value of type number in the field "Order" instead of text. Reload the page and fill in the form again.',
    far: 'The field "Order" has {count} characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
  },
};
for (const locale of locales) {
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
  test(`checks the size before normalizing a search at, past, and far past the limit in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      parseMarketSearch("x".repeat(fieldMaximumLength), texts[locale].field).ok,
    ).toBe(true);
    for (const length of [fieldMaximumLength + 1, fieldMaximumLength * 10])
      expect(
        parseMarketSearch(" ".repeat(length), texts[locale].field),
      ).toEqual({
        ok: false,
        failure: texts[locale].far.replace("{count}", formatNumber(length)),
      });
  });
}
