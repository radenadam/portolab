import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseGlossaryQuery } from "./glossary-search";
import { glossaryQueryMaximumLength } from "./glossary-query-maximum-length";

const texts: Record<
  Locale,
  { field: string; length: string; maximum: string; file: string }
> = {
  id: {
    field: "Cari istilah atau artinya",
    length:
      'Kolom "Cari istilah atau artinya" berisi 8.001 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
    maximum:
      'Kolom "Cari istilah atau artinya" memuat paling banyak 200 karakter, tetapi isinya 201 karakter. Persingkat isinya.',
    file: 'Formulir mengirim nilai bertipe File di kolom "Cari istilah atau artinya", bukan teks. Muat ulang halaman, lalu isi formulirnya lagi.',
  },
  en: {
    field: "Search terms or definitions",
    length:
      'The field "Search terms or definitions" has 8,001 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
    maximum:
      'The field "Search terms or definitions" holds at most 200 characters, but it has 201. Shorten it.',
    file: 'The form sent a value of type File in the field "Search terms or definitions" instead of text. Reload the page and fill in the form again.',
  },
};

for (const locale of locales) {
  test(`bounds the glossary query before trimming or searching in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = texts[locale];
    const maximum = "あ".repeat(glossaryQueryMaximumLength);
    expect(parseGlossaryQuery(maximum, text.field)).toEqual({
      ok: true,
      value: maximum,
    });
    for (const suffix of ["a", " "])
      expect(parseGlossaryQuery(`${maximum}${suffix}`, text.field)).toEqual({
        ok: false,
        failure: text.maximum,
      });
    expect(
      parseGlossaryQuery("a".repeat(fieldMaximumLength + 1), text.field),
    ).toEqual({ ok: false, failure: text.length });
    expect(parseGlossaryQuery("a".repeat(1_000_000), text.field).ok).toBe(
      false,
    );
    expect(parseGlossaryQuery(new File([], "query.txt"), text.field)).toEqual({
      ok: false,
      failure: text.file,
    });
  });
}
