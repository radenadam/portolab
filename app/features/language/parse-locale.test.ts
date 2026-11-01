import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseLocale } from "./parse-locale";

const failures: Record<
  Locale,
  { unknownLanguage: string; missingLanguage: string; notText: string }
> = {
  id: {
    unknownLanguage:
      'Formulir mengirim "fr" di kolom locale, tetapi Portolab hanya tersedia dalam Bahasa Indonesia dan English. Pilih salah satunya di pengalih bahasa.',
    missingLanguage:
      "Formulir tidak mengirim bahasa di kolom locale. Pilih Bahasa Indonesia atau English di pengalih bahasa.",
    notText:
      "Formulir mengirim nilai bertipe File di kolom locale, bukan teks. Pilih Bahasa Indonesia atau English di pengalih bahasa.",
  },
  en: {
    unknownLanguage:
      'The form sent "fr" in the field locale, but Portolab is only available in Bahasa Indonesia and English. Choose one of them in the language switch.',
    missingLanguage:
      "The form sent no language in the field locale. Choose Bahasa Indonesia or English in the language switch.",
    notText:
      "The form sent a value of type File in the field locale instead of text. Choose Bahasa Indonesia or English in the language switch.",
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

  test(`rejects an unknown language and names the field and the value in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseLocale("fr", "locale")).toEqual({
      ok: false,
      failure: failure.unknownLanguage,
    });
  });

  test(`rejects a missing language and names the field in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseLocale(null, "locale")).toEqual({
      ok: false,
      failure: failure.missingLanguage,
    });
  });

  test(`rejects a field that holds a file instead of text in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(parseLocale(new File([], "locale.txt"), "locale")).toEqual({
      ok: false,
      failure: failure.notText,
    });
  });
}
