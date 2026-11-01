import { expect, test } from "vitest";
import { characterCount, parseFilledText, parseShortText } from "./form-text";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";

const failures: Record<
  Locale,
  { empty: string; notText: string; tooLong: string }
> = {
  id: {
    empty: 'Isi kolom "Nama Anda".',
    notText:
      'Formulir mengirim nilai bertipe File di kolom "Nama Anda", bukan teks. Muat ulang halaman, lalu isi formulir lagi.',
    tooLong:
      'Kolom "Nama Anda" memuat paling banyak 1.000 karakter, tetapi isinya 1.001 karakter.',
  },
  en: {
    empty: 'Fill in the field "Your name".',
    notText:
      'The form sent a value of type File in the field "Your name" instead of text. Reload the page and fill in the form again.',
    tooLong:
      'The field "Your name" holds at most 1,000 characters, but it has 1,001.',
  },
};

const labels: Record<Locale, string> = { id: "Nama Anda", en: "Your name" };

test("reads a filled field as the person typed it", () => {
  expect(parseFilledText(" kopi pagi ", "Kata sandi")).toEqual({
    ok: true,
    value: " kopi pagi ",
  });
});

test("reads a short text without the spaces around it, with one space between words, in one normal form", () => {
  expect(
    parseShortText("  Budi \t  Santoso\u00a0 Cafe\u0301 ", "Nama Anda", 100),
  ).toEqual({ ok: true, value: "Budi Santoso Caf\u00e9" });
});

test("counts a letter outside the basic plane as one character", () => {
  expect(characterCount("𝒜𝒷")).toBe(2);
  expect(parseShortText("𝒜".repeat(3), "Nama Anda", 3)).toEqual({
    ok: true,
    value: "𝒜".repeat(3),
  });
});

for (const locale of locales) {
  const failure = failures[locale];
  const label = labels[locale];

  test(`rejects an empty or missing field and names its label in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of ["", "   ", null, undefined]) {
      expect(parseFilledText(value, label)).toEqual({
        ok: false,
        failure: failure.empty,
      });
    }
  });

  test(`rejects a file in a field of text and names its type in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parseShortText(new File([], "name.txt"), label, 100)).toEqual({
      ok: false,
      failure: failure.notText,
    });
  });

  test(`rejects a text longer than its field holds and formats both numbers in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parseShortText("a".repeat(1001), label, 1000)).toEqual({
      ok: false,
      failure: failure.tooLong,
    });
  });
}
