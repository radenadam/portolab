import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseLocale } from "./parse-locale";

const failures: Record<
  Locale,
  {
    label: string;
    unknownLanguage: readonly [string, string];
    pastAnyFieldMaximum: Record<"justPast" | "farPast", string>;
    missingLanguage: string;
    notText: string;
  }
> = {
  id: {
    label: "Bahasa",
    unknownLanguage: [
      'Formulir mengirim "',
      '" di kolom "Bahasa", tetapi Portolab hanya tersedia dalam Bahasa Indonesia dan English. Pilih salah satunya di pengalih bahasa.',
    ],
    pastAnyFieldMaximum: {
      justPast:
        'Kolom "Bahasa" berisi 8.001 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      farPast:
        'Kolom "Bahasa" berisi 1.000.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
    },
    missingLanguage:
      'Formulir tidak mengirim bahasa di kolom "Bahasa". Pilih Bahasa Indonesia atau English di pengalih bahasa.',
    notText:
      'Formulir mengirim nilai bertipe File di kolom "Bahasa", bukan teks. Pilih Bahasa Indonesia atau English di pengalih bahasa.',
  },
  en: {
    label: "Language",
    unknownLanguage: [
      'The form sent "',
      '" in the field "Language", but Portolab is only available in Bahasa Indonesia and English. Choose one of them in the language switch.',
    ],
    pastAnyFieldMaximum: {
      justPast:
        'The field "Language" has 8,001 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      farPast:
        'The field "Language" has 1,000,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
    },
    missingLanguage:
      'The form sent no language in the field "Language". Choose Bahasa Indonesia or English in the language switch.',
    notText:
      'The form sent a value of type File in the field "Language" instead of text. Choose Bahasa Indonesia or English in the language switch.',
  },
};

test("accepts each language that Portolab offers", () => {
  for (const locale of locales) {
    expect(parseLocale(locale, "locale")).toEqual({ ok: true, value: locale });
  }
});

for (const locale of locales) {
  const failure = failures[locale];
  const language = languageNames[locale];

  test(`rejects an unknown language and names the field and the value, up to the maximum of any field, in ${language}`, () => {
    switchLocaleForTest(locale);
    const [before, after] = failure.unknownLanguage;
    for (const value of ["fr", "a".repeat(fieldMaximumLength)]) {
      expect(parseLocale(value, failure.label)).toEqual({
        ok: false,
        failure: `${before}${value}${after}`,
      });
    }
  });

  test(`rejects a language past the maximum of any field, just or far, by its length without quoting it, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const [length, expected] of [
      [fieldMaximumLength + 1, failure.pastAnyFieldMaximum.justPast],
      [1_000_000, failure.pastAnyFieldMaximum.farPast],
    ] as const) {
      expect(parseLocale("a".repeat(length), failure.label)).toEqual({
        ok: false,
        failure: expected,
      });
    }
  });

  test(`rejects a missing language and names the field in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseLocale(null, failure.label)).toEqual({
      ok: false,
      failure: failure.missingLanguage,
    });
  });

  test(`rejects a field that holds a file instead of text in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseLocale(new File([], "locale.txt"), failure.label)).toEqual({
      ok: false,
      failure: failure.notText,
    });
  });
}
