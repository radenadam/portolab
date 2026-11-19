import { dateTimeFormat } from "./intl-formats.ts";
import { intlLocale } from "./intl-locale.ts";
import { locales } from "./paraglide/runtime.js";

const numberUnits = [
  String.raw`monthly\s+returns?`,
  String.raw`imbal\s+hasil\s+bulanan`,
  String.raw`complete\s+months?`,
  String.raw`(?:other\s+)?open\s+(?:buy|sell)\s+orders?`,
  String.raw`wrong\s+(?:attempts|passwords|codes)`,
  String.raw`kata\s+sandi`,
  "bytes?",
  "rupiah",
  "minutes?",
  "mins?",
  "menit",
  "mnt",
  "lots?",
  "lembar",
  "saham",
  "shares?",
  "points?",
  "poin",
  "years?",
  "tahun",
  "months?",
  "bulan",
  "weeks?",
  "minggu",
  "days?",
  "hari",
  "seconds?",
  "detik",
  "hours?",
  "jam",
  "characters?",
  "karakter",
  "students?",
  "mahasiswa",
  "orders?",
  "percobaan",
  "kode",
  "requests?",
  "permintaan",
  "accounts?",
  "akun",
  "sessions?",
  "sesi",
].join("|");

const digits = String.raw`\d+(?:[.,]\d+)*`;
const currency = String.raw`(?:Rp|IDR)\s*[+−±-]?${digits}(?:\s*(?:rb|jt|[KMBT]))?`;

// A date stays on one line with its time, as the section Interface text of AGENTS.md requires, so a date in each form that Portolab writes counts as one number: a day with its month and maybe its year, or a month with its year, in the order of its language and with its time of day and WIB after it, such as 19 Nov 2026, 16.14 WIB or Nov 19, 2026, 4:14 PM WIB, and a time of day with WIB. A time of day alone takes WIB, because a decimal number such as 4.17 in English reads like a time.
const months = `(?:${monthNamesOfLocales().join("|")})`;
const clock = String.raw`\d{1,2}[.:]\d{2}(?:\s?[AP]M)?`;
const dayFirst = String.raw`\d{1,2}\s+${months}(?:\s+\d{4})?`;
const monthFirst = String.raw`${months}\s+\d{1,2}(?!\d)(?:,\s+\d{4})?`;
const monthAndYear = String.raw`${months}\s+\d{4}`;
const date = String.raw`(?:(?:${dayFirst}|${monthFirst}|${monthAndYear})(?:,?\s+${clock})?(?:\s+WIB)?|${clock}\s+WIB)`;

function monthNamesOfLocales(): string[] {
  const names = new Set<string>();
  for (const locale of locales) {
    for (const month of ["short", "long"] as const) {
      const format = dateTimeFormat(intlLocale(locale), {
        month,
        timeZone: "UTC",
      });
      for (let index = 0; index < 12; index += 1)
        names.add(format.format(new Date(Date.UTC(2026, index, 1))));
    }
  }
  // A longer name comes first, so November wins over Nov.
  return [...names].sort((first, second) => second.length - first.length);
}

/** A shared pattern keeps rendering and the layout check from disagreeing about the signs, arrows, and units of a number, and about a date with its time. */
export const numberPattern = new RegExp(
  String.raw`(?<![\p{L}\p{N}_])${date}(?![\p{L}\p{N}_])|(?<![\p{L}\p{N}_])(?:[▲▼]\s*)?[+−±-]?(?:${currency}|[+−±-]?${digits})(?:(?:\s*-\s*|\s*)(?:%|(?:${numberUnits})\b))?(?:\s*[▲▼](?!\s*[+−±-]?(?:(?:Rp|IDR)\s*)?\d))?(?![.,]\d|[\p{L}\p{N}_])`,
  "gu",
);
