import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseSeenTotal } from "./parse-seen-total";

const texts: Record<
  Locale,
  {
    source: string;
    invalid: readonly [string, string];
    file: string;
    long: (length: string) => string;
    lengths: readonly [string, string];
  }
> = {
  id: {
    source: "Rincian biaya",
    invalid: [
      "Pratinjau dari Rincian biaya harus memuat total yang ditulis dengan angka saja, tetapi isinya ",
      ". Periksa rincian biaya, lalu konfirmasi lagi.",
    ],
    file: 'Formulir mengirim nilai bertipe File di kolom "Rincian biaya", bukan teks. Muat ulang halaman, lalu isi formulirnya lagi.',
    long: (length) =>
      `Kolom "Rincian biaya" berisi ${length} karakter, lebih banyak daripada yang diterima kolom ini. Isi kolom itu dengan teks yang dimintanya.`,
    lengths: ["8.001", "1.000.000"],
  },
  en: {
    source: "Cost breakdown",
    invalid: [
      "The preview from Cost breakdown must hold a total written in digits only, but it holds ",
      ". Check the cost breakdown, then confirm again.",
    ],
    file: 'The form sent a value of type File in the field "Cost breakdown" instead of text. Reload the page and fill in the form again.',
    long: (length) =>
      `The field "Cost breakdown" has ${length} characters, more than this field takes. Fill it in with the text that it asks for.`,
    lengths: ["8,001", "1,000,000"],
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`parses the hidden preview into rupiah and bounds malformed input in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [written, amount] of [
      ["0", 0],
      ["2493735", 2_493_735],
      ["0002493735", 2_493_735],
      ["9007199254740991", Number.MAX_SAFE_INTEGER],
      ["9007199254740992", null],
      ["1".repeat(fieldMaximumLength), null],
      ["", null],
      [null, null],
    ] as const) {
      expect(parseSeenTotal(written, text.source)).toEqual({
        ok: true,
        value: amount,
      });
    }
    for (const written of ["x", "-1", "1.5", "1e3", " 1 "]) {
      expect(parseSeenTotal(written, text.source)).toEqual({
        ok: false,
        failure: `${text.invalid[0]}${JSON.stringify(written)}${text.invalid[1]}`,
      });
    }
    expect(parseSeenTotal(new File([], "total"), text.source)).toEqual({
      ok: false,
      failure: text.file,
    });
    for (const [index, length] of [
      fieldMaximumLength + 1,
      1_000_000,
    ].entries()) {
      expect(parseSeenTotal("1".repeat(length), text.source)).toEqual({
        ok: false,
        failure: text.long(text.lengths[index] ?? "missing length"),
      });
    }
  });
}
