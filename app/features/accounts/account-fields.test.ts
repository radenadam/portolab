import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import {
  parseConsent,
  parseNewPassword,
  parsePersonName,
  parseRepeatedPassword,
} from "./account-fields";

const texts: Record<
  Locale,
  {
    name: string;
    password: string;
    repeated: string;
    consent: string;
    tooShort: string;
    tooLong: string;
    nameTooLong: string;
    passwordsDiffer: string;
    consentMissing: string;
  }
> = {
  id: {
    name: "Nama Anda",
    password: "Kata sandi baru",
    repeated: "Ulangi kata sandi baru",
    consent: "Saya menyetujui pemberitahuan privasi",
    tooShort:
      'Kolom "Kata sandi baru" perlu paling sedikit 15 karakter, tetapi isinya 14 karakter. Setiap karakter tambahan membuat kata sandi jauh lebih sulit ditebak, jadi pilih yang lebih panjang, misalnya kalimat pendek.',
    tooLong:
      'Kolom "Kata sandi baru" memuat paling banyak 128 karakter, tetapi isinya 129 karakter. Persingkat isinya.',
    nameTooLong:
      'Kolom "Nama Anda" memuat paling banyak 100 karakter, tetapi isinya 101 karakter. Persingkat isinya.',
    passwordsDiffer:
      'Isi kolom "Ulangi kata sandi baru" berbeda dari kata sandi baru. Ketik kata sandi yang sama di kedua kolom.',
    consentMissing:
      'Portolab hanya menyimpan data Anda dengan persetujuan Anda. Baca pemberitahuan privasi, lalu centang "Saya menyetujui pemberitahuan privasi".',
  },
  en: {
    name: "Your name",
    password: "New password",
    repeated: "New password again",
    consent: "I agree to the privacy notice",
    tooShort:
      'The field "New password" needs at least 15 characters, but it has 14. Each extra character makes a password much harder to guess, so choose a longer one, such as a short sentence.',
    tooLong:
      'The field "New password" holds at most 128 characters, but it has 129. Shorten it.',
    nameTooLong:
      'The field "Your name" holds at most 100 characters, but it has 101. Shorten it.',
    passwordsDiffer:
      'The field "New password again" differs from the new password. Type the same password in both fields.',
    consentMissing:
      'Portolab stores your data only with your agreement. Read the privacy notice, then tick "I agree to the privacy notice".',
  },
};

test("accepts a password from 15 to 128 characters, counted in the normal form that the hash reads", () => {
  for (const password of [
    "a".repeat(15),
    "a".repeat(128),
    "\u00bd".repeat(5),
  ]) {
    expect(parseNewPassword(password, "New password")).toEqual({
      ok: true,
      value: password.normalize("NFKC"),
    });
  }
});

test("accepts a repeated password in another normal form, and agreement only from the ticked box", () => {
  expect(
    parseRepeatedPassword(
      "kopi pagi di cafe\u0301",
      "New password again",
      "kopi pagi di caf\u00e9",
    ),
  ).toEqual({ ok: true, value: "kopi pagi di caf\u00e9" });
  expect(parseConsent("yes", "I agree")).toEqual({ ok: true, value: true });
});

for (const locale of locales) {
  const text = texts[locale];

  test(`rejects a password that is too short or too long, with both lengths, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parseNewPassword("a".repeat(14), text.password)).toEqual({
      ok: false,
      failure: text.tooShort,
    });
    expect(parseNewPassword("a".repeat(129), text.password)).toEqual({
      ok: false,
      failure: text.tooLong,
    });
  });

  test(`rejects a name that is too long in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parsePersonName("a".repeat(101), text.name)).toEqual({
      ok: false,
      failure: text.nameTooLong,
    });
  });

  test(`rejects a repeated password that differs in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of ["kopi pagi di kampus!", null]) {
      expect(
        parseRepeatedPassword(value, text.repeated, "kopi pagi di kampus"),
      ).toEqual({ ok: false, failure: text.passwordsDiffer });
    }
  });

  test(`rejects a form without agreement in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of [null, "no", ""]) {
      expect(parseConsent(value, text.consent)).toEqual({
        ok: false,
        failure: text.consentMissing,
      });
    }
  });
}
