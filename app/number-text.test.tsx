import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { NumberText } from "./number-text";
import { numberPattern } from "./number-pattern";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";

const values: Record<Locale, readonly string[]> = {
  id: [
    "Rp 498.000.000.000",
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
  test(`keeps every part of a number together within prose in ${locale}`, () => {
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
  test(`keeps prose and its number within one control label in ${locale}`, () => {
    const [verb, count] = controls[locale];
    const html = renderToStaticMarkup(
      <button type="button">
        <NumberText>{`${verb} ${count}`}</NumberText>
      </button>,
    ).replaceAll(/ class="[^"]*"/gu, "");
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

test("leaves words, instrument codes, and existing elements intact", () => {
  const text = "LQ45 BBCA AADI 1B 1M 5Y";
  expect(matchedNumbers(text)).toEqual([]);
  expect(
    renderToStaticMarkup(
      <NumberText>
        {text}
        <em>IHSG</em>
      </NumberText>,
    ),
  ).toBe(`${text}<em>IHSG</em>`);
});

function matchedNumbers(text: string): string[] {
  return Array.from(text.matchAll(numberPattern), (match) => match[0]);
}
