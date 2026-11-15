import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseAnalysisAxis } from "./parse-analysis-axis";

test("defaults an absent axis to beta and accepts both risk measures", () => {
  expect(parseAnalysisAxis(null, "axis")).toEqual({ ok: true, value: "beta" });
  for (const value of ["beta", "risk"])
    for (const entered of [value, ` ${value} `])
      expect(parseAnalysisAxis(entered, "axis")).toEqual({ ok: true, value });
});

test("rejects other risk axes and input that is not text", () => {
  for (const value of [
    "",
    "standard-deviation",
    "BETA",
    ["beta"],
    1,
    "x".repeat(100_000),
  ])
    expect(parseAnalysisAxis(value, "axis").ok).toBe(false);
});

const errors: Record<
  Locale,
  {
    field: string;
    five: string;
    maximum: string;
    justPast: string;
    farPast: string;
  }
> = {
  id: {
    field: "Sumbu risiko",
    five: 'Kolom "Sumbu risiko" berisi 5 karakter, tetapi hanya menerima "beta" atau "risk". Pilih salah satu sumbu risiko yang tercantum.',
    maximum:
      'Kolom "Sumbu risiko" berisi 8.000 karakter, tetapi hanya menerima "beta" atau "risk". Pilih salah satu sumbu risiko yang tercantum.',
    justPast:
      'Kolom "Sumbu risiko" berisi 8.001 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
    farPast:
      'Kolom "Sumbu risiko" berisi 1.000.000 karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.',
  },
  en: {
    field: "Risk axis",
    five: 'The field "Risk axis" has 5 characters, but it takes "beta" or "risk". Choose a listed risk axis.',
    maximum:
      'The field "Risk axis" has 8,000 characters, but it takes "beta" or "risk". Choose a listed risk axis.',
    justPast:
      'The field "Risk axis" has 8,001 characters, more than this field takes. Fill it in with the text that it asks for.',
    farPast:
      'The field "Risk axis" has 1,000,000 characters, more than this field takes. Fill it in with the text that it asks for.',
  },
};

for (const locale of locales) {
  const text = errors[locale];
  test(`describes text longer than the longest axis choice by its character count in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of ["W".repeat(5), "🧭".repeat(5)])
      expect(parseAnalysisAxis(value, text.field)).toEqual({
        ok: false,
        failure: text.five,
      });
    for (const character of ["W", "8"])
      expect(
        parseAnalysisAxis(character.repeat(fieldMaximumLength), text.field),
      ).toEqual({ ok: false, failure: text.maximum });
  });

  test(`bounds the raw axis before trimming at the limit, just past it, and far past it in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const padded = "beta".padEnd(fieldMaximumLength, " ");
    expect(parseAnalysisAxis(padded, text.field)).toEqual({
      ok: true,
      value: "beta",
    });
    for (const [value, failure] of [
      [`${padded} `, text.justPast],
      ["beta".padEnd(1_000_000, " "), text.farPast],
    ])
      expect(parseAnalysisAxis(value, text.field)).toEqual({
        ok: false,
        failure,
      });
  });
}
