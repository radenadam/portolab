import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { FieldFailure } from "./described-field";
import { formatNumber } from "./formatting";
import { languageNames } from "./language-names";
import { markupTextForTest } from "./markup-text-for-test";
import { m } from "./paraglide/messages.js";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { renderTextMarkupForTest } from "./render-text-markup-for-test";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { withoutClassNamesForTest } from "./without-class-names-for-test";

const expected: Record<Locale, { text: string; quantity: string }> = {
  id: {
    text: 'Kolom "42" memuat paling banyak 42 karakter, tetapi isinya 43 karakter. Persingkat isinya.',
    quantity: "42 karakter",
  },
  en: {
    text: 'The field "42" holds at most 42 characters, but it has 43. Shorten it.',
    quantity: "42 characters",
  },
};

for (const locale of locales) {
  test(`keeps quoted text apart from an identical quantity in a field error in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const maximum = 42;
    const value = formatNumber(maximum);
    for (const identifier of [value, `"${value}"`]) {
      const text = m.app_too_long_error({
        field: identifier,
        maximum: value,
        length: formatNumber(maximum + 1),
      });
      const failure = (
        <FieldFailure
          id="failure"
          text={text}
          quotedValue={` ${identifier} `}
        />
      );
      const sentence = markupTextForTest(
        expected[locale].text.replace(`"${value}"`, `"${identifier}"`),
      );
      expect(renderTextMarkupForTest(failure)).toContain(sentence);
      const html = withoutClassNamesForTest(renderToStaticMarkup(failure));
      expect(html).toContain(
        `<span data-text-value="">${markupTextForTest(identifier)}</span>`,
      );
      expect(html).toContain(
        `data-number="">${expected[locale].quantity}</span>`,
      );
      expect(
        renderTextMarkupForTest(<FieldFailure id="failure" text={text} />),
      ).toContain(sentence);
    }
    expect(
      renderToStaticMarkup(
        <FieldFailure id="failure" text={undefined} quotedValue={value} />,
      ),
    ).toBe("");
  });
}
