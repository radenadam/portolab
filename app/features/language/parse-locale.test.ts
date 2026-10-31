import { afterEach, expect, test } from "vitest";
import { getLocale, overwriteGetLocale } from "~/paraglide/runtime.js";
import { parseLocale } from "./parse-locale";

const defaultGetLocale = getLocale;

afterEach(() => {
  overwriteGetLocale(defaultGetLocale);
});

test("accepts each language that Portolab offers", () => {
  expect(parseLocale("id", "locale")).toEqual({ ok: true, value: "id" });
  expect(parseLocale("en", "locale")).toEqual({ ok: true, value: "en" });
});

test("rejects an unknown language in Bahasa Indonesia and names the field and the value", () => {
  expect(parseLocale("fr", "locale")).toEqual({
    ok: false,
    failure:
      'Formulir mengirim "fr" di kolom locale, tetapi Portolab hanya tersedia dalam Bahasa Indonesia dan English. Pilih salah satunya di pengalih bahasa.',
  });
});

test("rejects a missing language in Bahasa Indonesia and names the field", () => {
  expect(parseLocale(null, "locale")).toEqual({
    ok: false,
    failure:
      "Formulir tidak mengirim bahasa di kolom locale. Pilih Bahasa Indonesia atau English di pengalih bahasa.",
  });
});

test("rejects a field that holds a file instead of text in Bahasa Indonesia", () => {
  expect(parseLocale(new File([], "locale.txt"), "locale")).toEqual({
    ok: false,
    failure:
      "Formulir mengirim sesuatu yang bukan teks di kolom locale. Pilih Bahasa Indonesia atau English di pengalih bahasa.",
  });
});

test("rejects an unknown or missing language in English", () => {
  overwriteGetLocale(() => "en");
  expect(parseLocale("fr", "locale")).toEqual({
    ok: false,
    failure:
      'The form sent "fr" in the field locale, but Portolab is only available in Bahasa Indonesia and English. Choose one of them in the language switch.',
  });
  expect(parseLocale(null, "locale")).toEqual({
    ok: false,
    failure:
      "The form sent no language in the field locale. Choose Bahasa Indonesia or English in the language switch.",
  });
  expect(parseLocale(new File([], "locale.txt"), "locale")).toEqual({
    ok: false,
    failure:
      "The form sent something other than text in the field locale. Choose Bahasa Indonesia or English in the language switch.",
  });
});
