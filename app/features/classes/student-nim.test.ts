import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { nimMaximumLength } from "./nim-maximum-length";
import { parseStudentNim } from "./student-nim";

const texts: Record<Locale, { format: string; long: string; far: string }> = {
  id: {
    format:
      'Kolom "NIM" berisi "00 12", tetapi NIM hanya menerima karakter dari A sampai Z, a sampai z, 0 sampai 9, ".", "/", atau "-", dengan paling banyak 32 karakter. Perbaiki isinya atau kosongkan bila tidak ada.',
    long: 'Kolom "NIM" memuat paling banyak 32 karakter, tetapi isinya 33 karakter. Persingkat isinya.',
    far: 'Kolom "NIM" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
  },
  en: {
    format:
      'The field "NIM" holds "00 12", but a NIM takes only characters from A to Z, a to z, 0 to 9, ".", "/", or "-", with at most 32 characters. Correct it or leave it empty if you have none.',
    long: 'The field "NIM" holds at most 32 characters, but it has 33. Shorten it.',
    far: 'The field "NIM" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
  },
};

for (const locale of locales) {
  test(`preserves optional identifiers and refuses invalid or oversized NIMs in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of [null, "", "   "]) {
      expect(parseStudentNim(value, "NIM")).toEqual({ ok: true, value: null });
    }
    for (const value of [
      "00123",
      "Ab.01/2-3",
      "W".repeat(nimMaximumLength),
      "9".repeat(nimMaximumLength),
    ]) {
      expect(parseStudentNim(value, "NIM")).toEqual({ ok: true, value });
    }
    expect(parseStudentNim(" 00123 ", "NIM")).toEqual({
      ok: true,
      value: "00123",
    });
    for (const value of ["00 12", "00_12", "é", "123\n456", "１２３"]) {
      expect(parseStudentNim(value, "NIM").ok).toBe(false);
    }
    expect(parseStudentNim(" 00 12 ", "NIM")).toEqual({
      ok: false,
      failure: texts[locale].format,
    });
    expect(parseStudentNim("W".repeat(nimMaximumLength + 1), "NIM")).toEqual({
      ok: false,
      failure: texts[locale].long,
    });
    expect(parseStudentNim("W".repeat(fieldMaximumLength + 1), "NIM")).toEqual({
      ok: false,
      failure: texts[locale].far,
    });
    const longest = "W".repeat(nimMaximumLength);
    expect(
      parseStudentNim(` ${" ".repeat(nimMaximumLength)}${longest} `, "NIM"),
    ).toEqual({ ok: true, value: longest });
    expect(parseStudentNim(new File(["123"], "nim.txt"), "NIM").ok).toBe(false);
  });
}
