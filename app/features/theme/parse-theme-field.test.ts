import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { fieldMaximumLength } from "~/form-size";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseThemeField } from "./parse-theme-field";
import { themes } from "./theme";

const texts: Record<
  Locale,
  {
    field: string;
    unknown: readonly [string, string];
    missing: string;
    file: string;
    long: readonly string[];
    longChoices: readonly string[];
  }
> = {
  id: {
    field: "Tema",
    unknown: [
      'Formulir mengirim "',
      '" di kolom "Tema", tetapi kolom ini hanya menerima Sistem, Terang, atau Gelap. Pilih salah satunya di pilihan tema.',
    ],
    missing:
      'Formulir tidak mengirim tema di kolom "Tema". Pilih Sistem, Terang, atau Gelap di pilihan tema.',
    file: 'Formulir mengirim nilai bertipe File di kolom "Tema", bukan teks. Pilih Sistem, Terang, atau Gelap di pilihan tema.',
    longChoices: [
      'Formulir mengirim 7 karakter di kolom "Tema", tetapi kolom ini hanya menerima Sistem, Terang, atau Gelap. Pilih salah satunya di pilihan tema.',
      'Formulir mengirim 8.000 karakter di kolom "Tema", tetapi kolom ini hanya menerima Sistem, Terang, atau Gelap. Pilih salah satunya di pilihan tema.',
    ],
    long: [
      'Kolom "Tema" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
      'Kolom "Tema" berisi 1.000.000 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    ],
  },
  en: {
    field: "Theme",
    unknown: [
      'The form sent "',
      '" in the field "Theme", but this field only takes System, Light, or Dark. Choose one of them in the theme choice.',
    ],
    missing:
      'The form sent no theme in the field "Theme". Choose System, Light, or Dark in the theme choice.',
    file: 'The form sent a value of type File in the field "Theme" instead of text. Choose System, Light, or Dark in the theme choice.',
    longChoices: [
      'The form sent 7 characters in the field "Theme", but this field only takes System, Light, or Dark. Choose one of them in the theme choice.',
      'The form sent 8,000 characters in the field "Theme", but this field only takes System, Light, or Dark. Choose one of them in the theme choice.',
    ],
    long: [
      'The field "Theme" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
      'The field "Theme" has 1,000,000 characters, more than this field takes. Fill it in with the text that it asks for.',
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`accepts every theme and rejects forged fields in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const theme of themes)
      expect(parseThemeField(theme, text.field)).toEqual({
        ok: true,
        value: theme,
      });
    for (const value of ["sepia", " sepia "]) {
      expect(parseThemeField(value, text.field)).toEqual({
        ok: false,
        failure: text.unknown[0] + value.trim() + text.unknown[1],
      });
    }
    for (const value of [null, undefined])
      expect(parseThemeField(value, text.field)).toEqual({
        ok: false,
        failure: text.missing,
      });
    for (const [index, length] of [7, fieldMaximumLength].entries()) {
      for (const character of ["a", "9"])
        expect(parseThemeField(character.repeat(length), text.field)).toEqual({
          ok: false,
          failure: text.longChoices[index],
        });
    }
    expect(parseThemeField("", text.field)).toEqual({
      ok: false,
      failure: text.unknown[0] + text.unknown[1],
    });
    for (const theme of themes)
      expect(parseThemeField(` ${theme} `, text.field)).toEqual({
        ok: true,
        value: theme,
      });
    expect(parseThemeField(new File([], "theme"), text.field)).toEqual({
      ok: false,
      failure: text.file,
    });
    for (const [index, length] of [fieldMaximumLength + 1, 1_000_000].entries())
      expect(parseThemeField("a".repeat(length), text.field)).toEqual({
        ok: false,
        failure: text.long[index],
      });
  });
}
