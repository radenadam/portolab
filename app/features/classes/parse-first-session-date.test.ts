import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseFirstSessionDate } from "./parse-first-session-date";

// 10:00 WIB on Saturday 14 November 2026, so the field takes 14 November 2025 to 14 November 2027.
const now = new Date("2026-11-14T03:00:00.000Z");

const texts: Record<
  Locale,
  {
    label: string;
    noDate: string;
    notDate: readonly [string, string];
    outside: readonly (readonly [string, string])[];
    outOfRange: readonly [string, string];
    pastAnyFieldMaximum: Record<"justPast" | "farPast", string>;
    notText: string;
  }
> = {
  id: {
    label: "Tanggal sesi 1",
    noDate:
      'Kolom "Tanggal sesi 1" belum berisi tanggal yang lengkap. Isi kolom itu dengan hari, bulan, dan tahun sesi 1, karena Portolab menghitung sesi setiap minggu dari tanggal itu.',
    notDate: [
      'Formulir mengirim "',
      '" di kolom "Tanggal sesi 1", bukan tanggal. Muat ulang halaman, lalu isi formulirnya lagi.',
    ],
    outside: [
      ["2025-11-13", "13 November 2025"],
      ["2027-11-15", "15 November 2027"],
      ["0001-01-01", "1 Januari 1"],
      ["9999-12-31", "31 Desember 9999"],
    ],
    outOfRange: [
      'Kolom "Tanggal sesi 1" menerima 14 November 2025 sampai 14 November 2027, tetapi isinya "',
      '". Sebuah kelas berlangsung pada semester ini atau semester di dekatnya, sehingga Portolab menerima tanggal sesi 1 paling jauh 365 hari sebelum atau sesudah hari ini. Periksa tahun tanggal itu.',
    ],
    pastAnyFieldMaximum: {
      justPast:
        'Kolom "Tanggal sesi 1" berisi 8.001 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
      farPast:
        'Kolom "Tanggal sesi 1" berisi 1.000.000 karakter, jauh lebih banyak daripada yang diterima kolom mana pun di Portolab. Isi kolom itu dengan teks yang dimintanya.',
    },
    notText:
      'Formulir mengirim nilai bertipe File di kolom "Tanggal sesi 1", bukan teks. Muat ulang halaman, lalu isi formulirnya lagi.',
  },
  en: {
    label: "Date of session 1",
    noDate:
      'The field "Date of session 1" holds no complete date yet. Fill it in with the day, the month, and the year of session 1, because Portolab counts the session of each week from that date.',
    notDate: [
      'The form sent "',
      '" in the field "Date of session 1" instead of a date. Reload the page and fill in the form again.',
    ],
    outside: [
      ["2025-11-13", "November 13, 2025"],
      ["2027-11-15", "November 15, 2027"],
      ["0001-01-01", "January 1, 1"],
      ["9999-12-31", "December 31, 9999"],
    ],
    outOfRange: [
      'The field "Date of session 1" takes November 14, 2025 to November 14, 2027, but it holds "',
      '". A class runs in the current semester or a near one, so Portolab takes a date of session 1 at most 365 days before or after today. Check the year of the date.',
    ],
    pastAnyFieldMaximum: {
      justPast:
        'The field "Date of session 1" has 8,001 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
      farPast:
        'The field "Date of session 1" has 1,000,000 characters, far more than any field of Portolab takes. Fill it in with the text that it asks for.',
    },
    notText:
      'The form sent a value of type File in the field "Date of session 1" instead of text. Reload the page and fill in the form again.',
  },
};

test("reads a date from the earliest to the latest day that the field takes, around the day of the moment in WIB", () => {
  for (const [date, moment] of [
    ["2025-11-14", now],
    ["2026-09-12", now],
    [" 2027-11-14 ", now],
    // 00:00 WIB on Saturday 14 November 2026 is still Friday 13 November in UTC.
    ["2027-11-14", new Date("2026-11-13T17:00:00.000Z")],
  ] as const) {
    expect(
      parseFirstSessionDate(date, "firstSessionDate", moment),
      date,
    ).toEqual({ ok: true, value: date.trim() });
  }
});

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`rejects a field without a whole date and names the field in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const value of [null, "", "   "]) {
      expect(
        parseFirstSessionDate(value, text.label, now),
        String(value),
      ).toEqual({
        ok: false,
        failure: text.noDate,
      });
    }
  });

  test(`rejects a text that is no date of the calendar, up to the maximum of any field, and quotes it in ${language}`, () => {
    switchLocaleForTest(locale);
    const [before, after] = text.notDate;
    for (const value of [
      "7/9/2026",
      "2026-9-7",
      "2026-02-30",
      "2026-13-01",
      "20266-09-07",
      "2026-09-07T10:00",
      "a".repeat(fieldMaximumLength),
    ]) {
      expect(parseFirstSessionDate(value, text.label, now), value).toEqual({
        ok: false,
        failure: `${before}${value}${after}`,
      });
    }
  });

  test(`rejects a date one day or more outside the days that the field takes, with both limits, in ${language}`, () => {
    switchLocaleForTest(locale);
    const [before, after] = text.outOfRange;
    for (const [value, shown] of text.outside) {
      expect(parseFirstSessionDate(value, text.label, now), value).toEqual({
        ok: false,
        failure: `${before}${shown}${after}`,
      });
    }
  });

  test(`rejects a field past the maximum of any field, just or far, by its length without quoting it, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const [length, expected] of [
      [fieldMaximumLength + 1, text.pastAnyFieldMaximum.justPast],
      [1_000_000, text.pastAnyFieldMaximum.farPast],
    ] as const) {
      expect(
        parseFirstSessionDate("a".repeat(length), text.label, now),
      ).toEqual({ ok: false, failure: expected });
    }
  });

  test(`rejects a field that holds a file instead of text in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      parseFirstSessionDate(new File([], "date.txt"), text.label, now),
    ).toEqual({ ok: false, failure: text.notText });
  });
}
