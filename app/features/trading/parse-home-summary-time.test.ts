import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { homeSummaryTimeMaximumLength } from "./home-summary-time";
import { parseHomeSummaryTime } from "./parse-home-summary-time";

const snapshotErrorTexts: Record<
  Locale,
  {
    source: string;
    missing: string;
    file: string;
    invalid: (value: string) => string;
    long: (length: string) => string;
    length: string;
    end: string;
  }
> = {
  id: {
    source: "Sejak kunjungan terakhir",
    missing: "tidak ada",
    file: "bertipe File, bukan teks",
    invalid: (value) =>
      `berisi ${value}, tetapi waktu itu tidak sah untuk keanggotaan Anda`,
    long: (length) =>
      `berisi ${length} karakter, sehingga bukan waktu dari ringkasan`,
    length: "1.000.000",
    end: ". Portolab hanya menutup kejadian yang termasuk saat ringkasan dimuat. Muat ulang Beranda, lalu tutup ringkasan terbaru.",
  },
  en: {
    source: "Since your last visit",
    missing: "is missing",
    file: "has type File instead of text",
    invalid: (value) =>
      `holds ${value}, but this is not a valid summary time for your membership`,
    long: (length) =>
      `has ${length} characters, so it cannot be a time from the summary`,
    length: "1,000,000",
    end: ". Portolab closes only outcomes included when the summary loaded. Reload Home, then close the latest summary.",
  },
};
const input = {
  joinedAt: new Date("2026-11-02T03:00:00Z"),
  now: new Date("2026-11-02T04:00:00Z"),
};
const prefixes: Record<Locale, string> = {
  id: 'Waktu untuk "',
  en: 'The time for "',
};
for (const locale of locales) {
  test(`parses the loaded summary time and bounds forged metadata in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = snapshotErrorTexts[locale];
    const failure = (problem: string) => ({
      ok: false,
      failure: `${prefixes[locale]}${text.source}" ${problem}${text.end}`,
    });
    for (const moment of [
      input.joinedAt,
      new Date("2026-11-02T03:30:00Z"),
      input.now,
    ])
      expect(
        parseHomeSummaryTime(moment.toISOString(), text.source, input),
      ).toEqual({ ok: true, value: moment });
    const written = ` ${input.joinedAt.toISOString()}  `;
    expect(written).toHaveLength(homeSummaryTimeMaximumLength);
    expect(parseHomeSummaryTime(written, text.source, input)).toEqual({
      ok: true,
      value: input.joinedAt,
    });
    for (const value of [undefined, null, "", " "])
      expect(parseHomeSummaryTime(value, text.source, input)).toEqual(
        failure(text.missing),
      );
    expect(
      parseHomeSummaryTime(new File([], "time"), text.source, input),
    ).toEqual(failure(text.file));
    for (const value of [
      "bad",
      "2026-02-30T03:30:00.000Z",
      "2026-11-02T02:59:59.999Z",
      "2026-11-02T04:00:00.001Z",
    ])
      expect(parseHomeSummaryTime(value, text.source, input)).toEqual(
        failure(text.invalid(JSON.stringify(value))),
      );
    for (const [length, formatted] of [
      [homeSummaryTimeMaximumLength + 1, "28"],
      [1_000_000, text.length],
    ] as const)
      expect(
        parseHomeSummaryTime("x".repeat(length), text.source, input),
      ).toEqual(failure(text.long(formatted)));
  });
}
