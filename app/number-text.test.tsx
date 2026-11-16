import { languageNames } from "./language-names";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { NumberText } from "./number-text";
import { renderTextMarkupForTest } from "./render-text-markup-for-test";
import { numberPattern } from "./number-pattern";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { withoutClassNamesForTest } from "./without-class-names-for-test";

const values: Record<Locale, readonly string[]> = {
  id: [
    "Rp 498.000.000.000",
    "Rp498 M",
    "Rp1,5 jt",
    "▲ +Rp1 T",
    "▲ +Rp 3.259.000.000",
    "▼ -0,81%",
    "+0,81% ▲",
    "128.000 byte",
    "10 mnt",
    "±10 mnt",
    "50.000 lot",
    "5.500 saham",
    "1 imbal hasil bulanan",
    "60 imbal hasil bulanan",
    "100 karakter",
    "30 mahasiswa",
    "52 minggu",
  ],
  en: [
    "IDR 498,000,000,000",
    "IDR498B",
    "IDR1.5M",
    "▲ +IDR1T",
    "▲ +IDR 3,259,000,000",
    "▼ -0.81%",
    "+0.81% ▲",
    "128,000 bytes",
    "10 mins",
    "±10 mins",
    "50,000 lots",
    "5,500 shares",
    "1 monthly return",
    "60 monthly returns",
    "100 characters",
    "30 students",
    "52-week",
  ],
};

const adjacent: Record<Locale, readonly [string, string]> = {
  id: ["Rp 5.000", "▲ +2%"],
  en: ["IDR 5,000", "▲ +2%"],
};

const controls: Record<Locale, readonly [string, string]> = {
  id: ["Beli", "50.000 lot"],
  en: ["Buy", "50,000 lots"],
};

for (const locale of locales) {
  test(`keeps every part of a number together within prose in ${languageNames[locale]}`, () => {
    for (const value of values[locale]) {
      const text = `(${value}).`;
      expect(matchedNumbers(text)).toEqual([value]);
      const html = renderToStaticMarkup(<NumberText>{text}</NumberText>);
      expect(html).toMatch(
        new RegExp(
          `^<span data-number-text="">\\(<span class="[^"]+" data-number="">`,
        ),
      );
      expect(html).toContain(`>${value}</span>).`);
    }
    const text = adjacent[locale].join(" ");
    expect(matchedNumbers(text)).toEqual(adjacent[locale]);
  });
  test(`keeps prose and its number within one control label in ${languageNames[locale]}`, () => {
    const [verb, count] = controls[locale];
    const html = withoutClassNamesForTest(
      renderToStaticMarkup(
        <button type="button">
          <NumberText>{`${verb} ${count}`}</NumberText>
        </button>,
      ),
    );
    expect(html).toBe(
      `<button type="button"><span data-number-text="">${verb} <span data-number="">${count}</span></span></button>`,
    );
  });
}

test("keeps an arrow in a separate element within the same number", () => {
  const html = renderToStaticMarkup(
    <NumberText whole>
      <span aria-hidden>▲ </span>+Rp 75
    </NumberText>,
  );
  expect(html).toContain(
    'data-number=""><span aria-hidden="true">▲ </span>+Rp 75</span>',
  );
});

test("keeps numbers within adjacent text and nested arrays", () => {
  const html = renderToStaticMarkup(
    <NumberText>
      Nilai {"Rp 498.000.000.000"}
      {[" atau ", ["IDR 498,000,000,000"]]}
    </NumberText>,
  );
  expect(html).toContain('data-number="">Rp 498.000.000.000</span>');
  expect(html).toContain('data-number="">IDR 498,000,000,000</span>');
});

test("leaves words and instrument codes intact", () => {
  const text = "LQ45 BBCA AADI 1B 1M 5Y";
  expect(matchedNumbers(text)).toEqual([]);
  expect(renderToStaticMarkup(<NumberText>{text}</NumberText>)).toBe(text);
});

test("leaves a long digit-only name as text", () => {
  const name = "8".repeat(100);
  expect(
    withoutClassNamesForTest(
      renderToStaticMarkup(<NumberText verbatim>{name}</NumberText>),
    ),
  ).toBe(`<span data-text-value="">${name}</span>`);
});

const mixedTexts: Record<Locale, { quantity: string; verb: string }> = {
  id: { quantity: "1 imbal hasil bulanan", verb: "memiliki" },
  en: { quantity: "1 monthly return", verb: "has" },
};

for (const locale of locales) {
  test(`keeps text placeholders distinct from identical quantities in ${languageNames[locale]}`, () => {
    const { quantity, verb } = mixedTexts[locale];
    const html = renderToStaticMarkup(
      <NumberText>
        {(textValue) =>
          `${textValue("1")} ${verb} ${quantity} (${textValue(quantity)}).`
        }
      </NumberText>,
    );
    expect(html).toContain('data-text-value="">1</span>');
    expect(html).toContain(`data-number="">${quantity}</span>`);
    expect(html).toContain(`data-text-value="">${quantity}</span>`);
    expect(
      renderTextMarkupForTest(
        <NumberText>
          {(textValue) => `${textValue("1")} ${verb} ${quantity}.`}
        </NumberText>,
      ),
    ).toBe(`1 ${verb} ${quantity}.`);
  });
}

test("requires an explicit whole group for an element", () => {
  const element = <em>128.000 byte</em>;
  // A default wrapper cannot inspect an element's text, so its type rejects this ineffective use.
  // @ts-expect-error Only a whole number group accepts element children.
  const ineffective = <NumberText>{element}</NumberText>;
  expect(ineffective).toBeDefined();
  expect(
    renderToStaticMarkup(<NumberText whole>{element}</NumberText>),
  ).toContain('data-number=""><em>128.000 byte</em></span>');
});

const wholeTimes: Record<Locale, string> = {
  id: "30 Okt 2026, 16.14 WIB",
  en: "Oct 30, 2026, 4:14 PM WIB",
};

for (const locale of locales)
  test(`keeps an explicitly marked date and time together inside a complete message in ${languageNames[locale]}`, () => {
    const time = wholeTimes[locale];
    const html = renderToStaticMarkup(
      <NumberText>
        {(textValue) =>
          `${textValue("2026")}: ${textValue(<NumberText whole>{time}</NumberText>)}.`
        }
      </NumberText>,
    );
    expect(html).toContain('data-text-value="">2026</span>');
    expect(html).toContain(`data-number="">${time}</span>.`);
  });

function matchedNumbers(text: string): string[] {
  return Array.from(text.matchAll(numberPattern), (match) => match[0]);
}
