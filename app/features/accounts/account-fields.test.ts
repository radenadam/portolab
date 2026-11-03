import { expect, test } from "vitest";
import { formDataForTest } from "~/form-data-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { fieldMaximumLength } from "~/form-size";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import {
  parseConsent,
  parsePersonName,
  readNewPassword,
  readNewStudent,
} from "./account-fields";

/** A form with a new password in its two fields, or null for a field that the form did not send. */
function passwordForm(
  newPassword: string,
  repeatedPassword: string | null,
): FormData {
  return formDataForTest(
    repeatedPassword === null
      ? { newPassword }
      : { newPassword, repeatedPassword },
  );
}

const texts: Record<
  Locale,
  {
    name: string;
    consent: string;
    usernameMalformed: string;
    tooShort: string;
    tooLong: string;
    nameTooLong: string;
    passwordsDiffer: string;
    consentMissing: string;
    atAnyFieldMaximum: string;
    pastAnyFieldMaximum: Record<
      "justPast" | "farPast",
      readonly [newPassword: string, repeatedPassword: string]
    >;
  }
> = {
  id: {
    name: "Nama Anda",
    consent: "Saya menyetujui pemberitahuan privasi",
    usernameMalformed:
      'Kolom "Nama pengguna" menerima 3 sampai 32 karakter dari a sampai z, 0 sampai 9, ".", "-", dan "_", tetapi isinya "budi santoso". Pilih nama pengguna, misalnya budi.santoso.',
    tooShort:
      'Kolom "Kata sandi baru" perlu paling sedikit 15 karakter, tetapi isinya 14 karakter. Setiap karakter tambahan membuat kata sandi jauh lebih sulit ditebak, jadi pilih yang lebih panjang, misalnya kalimat pendek.',
    tooLong:
      'Kolom "Kata sandi baru" memuat paling banyak 128 karakter, tetapi isinya 129 karakter. Persingkat isinya.',
    nameTooLong:
      'Kolom "Nama Anda" memuat paling banyak 100 karakter, tetapi isinya 101 karakter. Persingkat isinya.',
    passwordsDiffer:
      'Kolom "Ulangi kata sandi baru" berbeda dari kata sandi baru. Ketik kata sandi yang sama di kedua kolom.',
    consentMissing:
      'Portolab hanya menyimpan data Anda dengan persetujuan Anda. Baca pemberitahuan privasi, lalu centang "Saya menyetujui pemberitahuan privasi".',
    atAnyFieldMaximum:
      'Kolom "Kata sandi baru" memuat paling banyak 128 karakter, tetapi isinya 8.000 karakter. Persingkat isinya.',
    pastAnyFieldMaximum: {
      justPast: [
        'Kolom "Kata sandi baru" berisi 8.001 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
        'Kolom "Ulangi kata sandi baru" berisi 8.001 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      ],
      farPast: [
        'Kolom "Kata sandi baru" berisi 1.000.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
        'Kolom "Ulangi kata sandi baru" berisi 1.000.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      ],
    },
  },
  en: {
    name: "Your name",
    consent: "I agree to the privacy notice",
    usernameMalformed:
      'The field "Username" takes 3 to 32 characters from a to z, 0 to 9, ".", "-", and "_", but it holds "budi santoso". Choose a username, such as budi.santoso.',
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
    atAnyFieldMaximum:
      'The field "New password" holds at most 128 characters, but it has 8,000. Shorten it.',
    pastAnyFieldMaximum: {
      justPast: [
        'The field "New password" has 8,001 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
        'The field "New password again" has 8,001 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      ],
      farPast: [
        'The field "New password" has 1,000,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
        'The field "New password again" has 1,000,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      ],
    },
  },
};

test("accepts a password from its shortest to its longest length, counted in the normal form that the hash reads", () => {
  for (const password of [
    "a".repeat(15),
    "a".repeat(128),
    "\u00bd".repeat(5),
  ]) {
    expect(readNewPassword(passwordForm(password, password))).toEqual({
      ok: true,
      value: password.normalize("NFKC"),
    });
  }
});

test("accepts a repeated password in another normal form, and agreement only from the ticked box", () => {
  expect(
    readNewPassword(
      passwordForm("kopi pagi di caf\u00e9", "kopi pagi di cafe\u0301"),
    ),
  ).toEqual({ ok: true, value: "kopi pagi di caf\u00e9" });
  expect(parseConsent("yes", "I agree")).toEqual({ ok: true, value: true });
});

test("reads the account of a new student, with the username in lowercase", () => {
  const form = passwordForm("teh sore di taman", "teh sore di taman");
  form.set("name", "  Sari   Wulandari ");
  form.set("username", " Sari ");
  form.set("consent", "yes");
  expect(readNewStudent(form)).toEqual({
    ok: true,
    value: {
      name: "Sari Wulandari",
      username: "sari",
      password: "teh sore di taman",
    },
  });
});

for (const locale of locales) {
  const text = texts[locale];

  test(`rejects a username of other characters, and shows every field of a new student with its failure, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const form = passwordForm("short", "short");
    form.set("name", "Sari");
    form.set("username", "budi santoso");
    expect(readNewStudent(form)).toEqual({
      ok: false,
      failure: {
        name: "Sari",
        username: "budi santoso",
        nameFailure: undefined,
        usernameFailure: text.usernameMalformed,
        newPasswordFailure: text.tooShort.replace("14", "5"),
        repeatedPasswordFailure: undefined,
        consentFailure: text.consentMissing,
      },
    });
  });

  test(`rejects a password that is too short or too long, with both lengths, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [length, failure] of [
      [14, text.tooShort],
      [129, text.tooLong],
    ] as const) {
      const password = "a".repeat(length);
      expect(readNewPassword(passwordForm(password, password))).toEqual({
        ok: false,
        failure: {
          newPasswordFailure: failure,
          repeatedPasswordFailure: undefined,
        },
      });
    }
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
    for (const repeated of ["kopi pagi di kampus!", null]) {
      expect(
        readNewPassword(passwordForm("kopi pagi di kampus", repeated)),
      ).toEqual({
        ok: false,
        failure: {
          newPasswordFailure: undefined,
          repeatedPasswordFailure: text.passwordsDiffer,
        },
      });
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

  test(`rejects a new password or its repetition at the maximum of any field by the rule of its field, and past that maximum by its length before it normalizes it, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const password = "kopi pagi di kampus";
    const atMaximum = password.padEnd(fieldMaximumLength);
    expect(readNewPassword(passwordForm(atMaximum, atMaximum))).toEqual({
      ok: false,
      failure: {
        newPasswordFailure: text.atAnyFieldMaximum,
        repeatedPasswordFailure: undefined,
      },
    });
    expect(readNewPassword(passwordForm(password, atMaximum))).toEqual({
      ok: false,
      failure: {
        newPasswordFailure: undefined,
        repeatedPasswordFailure: text.passwordsDiffer,
      },
    });
    for (const [length, failures] of [
      [fieldMaximumLength + 1, text.pastAnyFieldMaximum.justPast],
      [1_000_000, text.pastAnyFieldMaximum.farPast],
    ] as const) {
      const padded = password.padEnd(length);
      const [newPasswordFailure, repeatedPasswordFailure] = failures;
      expect(readNewPassword(passwordForm(padded, padded))).toEqual({
        ok: false,
        failure: { newPasswordFailure, repeatedPasswordFailure: undefined },
      });
      expect(readNewPassword(passwordForm(password, padded))).toEqual({
        ok: false,
        failure: { newPasswordFailure: undefined, repeatedPasswordFailure },
      });
    }
  });
}
