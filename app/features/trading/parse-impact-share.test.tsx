import { expect, test } from "vitest";
import { fieldMaximumLength } from "~/form-size";
import { languageNames } from "~/language-names";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { parseImpactShare } from "./parse-impact-share";
import { readImpactSelection } from "./read-impact-selection.server";
import { impactSelectionTextForTest } from "./impact-selection-text-for-test";
import { TradeImpactSelectionForm } from "./trade-impact-selection-form";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";

test("accepts the three impact shares and keeps an absent choice for the default", () => {
  expect(parseImpactShare(null, "share")).toEqual({
    ok: true,
    value: undefined,
  });
  // Python Decimal divides 5, 10, and 20 by 100 to give these encoded weights.
  for (const value of [0.05, 0.1, 0.2]) {
    expect(parseImpactShare(String(value), "share")).toEqual({
      ok: true,
      value,
    });
  }
  for (const value of [undefined, 0.1, [], {}, "0.11"])
    expect(parseImpactShare(value, "share").ok).toBe(false);
});

const sourceTexts: Record<
  Locale,
  { source: string; five: string; apply: string }
> = {
  id: {
    source: "Anggaran",
    five: 'Kolom "Anggaran" berisi 5 karakter, tetapi hanya menerima "5%", "10%", atau "20%". Pilih salah satunya.',
    apply: "Tampilkan dampak",
  },
  en: {
    source: "Budget",
    five: 'The field "Budget" has 5 characters, but it takes only "5%", "10%", or "20%". Choose one of them.',
    apply: "Show impact",
  },
};

for (const locale of locales) {
  const text = impactSelectionTextForTest[locale];
  const source = sourceTexts[locale];
  test(`explains invalid impact selections and keeps their correction fields in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(parseImpactShare("0.3", text.share)).toEqual({
      ok: false,
      failure: text.shareFailure,
    });
    expect(parseImpactShare("", text.share)).toEqual({
      ok: false,
      failure: text.empty,
    });
    const result = readImpactSelection(
      new URL(
        "https://portolab.test/classes/1/stocks/BBCA/buy?lots=10&impact=0.3&impactAxis=%20BETA%20",
      ),
    );
    expect(result.fields).toMatchObject({
      share: "0.3",
      axis: " BETA ",
      shareFailure: text.shareFailure,
      axisFailure: text.axisFailure,
      path: "/classes/1/stocks/BBCA/buy",
      kept: [["lots", "10"]],
    });
    if (result.fields === undefined)
      throw new Error("Both selections must be refused.");
    const markup = renderMarkupForTest(
      <TradeImpactSelectionForm fields={result.fields} />,
    );
    for (const value of [
      text.share,
      text.axis,
      text.shareFailure,
      text.axisFailure,
      source.apply,
    ])
      expect(markup).toContain(markupTextForTest(value));
    expect(markup).toContain('value=" BETA "');
  });
  test(`bounds an impact share at the field guard, just past it, and far past it in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const value of ["0.200", "🧭".repeat(5)])
      expect(parseImpactShare(value, source.source)).toEqual({
        ok: false,
        failure: source.five,
      });
    for (const character of ["W", "8"])
      expect(
        parseImpactShare(character.repeat(fieldMaximumLength), text.share),
      ).toEqual({ ok: false, failure: text.longShare });
    for (const [length, failure] of [
      [fieldMaximumLength + 1, text.justPast],
      [1_000_000, text.farPast],
    ] as const)
      expect(parseImpactShare("W".repeat(length), text.share)).toEqual({
        ok: false,
        failure,
      });
  });
}
