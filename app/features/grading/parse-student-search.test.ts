import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseStudentSearch } from "./parse-student-search";

const texts: Record<Locale, { label: string; failures: readonly string[] }> = {
  id: {
    label: "Cari nama atau nama pengguna",
    failures: [
      'Kolom "Cari nama atau nama pengguna" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
      'Kolom "Cari nama atau nama pengguna" berisi 800.000 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    ],
  },
  en: {
    label: "Search name or username",
    failures: [
      'The field "Search name or username" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
      'The field "Search name or username" has 800,000 characters, more than this field takes. Fill it in with the text that it asks for.',
    ],
  },
};

for (const locale of locales) {
  test(`accepts an empty search and the field limit, and explains an oversized search at its field in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parseStudentSearch("", texts[locale].label)).toEqual({
      ok: true,
      value: "",
    });
    expect(
      parseStudentSearch("a".repeat(fieldMaximumLength), texts[locale].label)
        .ok,
    ).toBe(true);
    for (const [index, length] of [
      fieldMaximumLength + 1,
      fieldMaximumLength * 100,
    ].entries())
      expect(
        parseStudentSearch("a".repeat(length), texts[locale].label),
      ).toEqual({ ok: false, failure: texts[locale].failures[index] });
  });
}
