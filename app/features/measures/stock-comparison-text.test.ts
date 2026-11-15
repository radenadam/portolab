import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { formatBeta, formatCorrelation } from "~/formatting";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { beta } from "~/units/beta";
import { correlation } from "~/units/correlation";
import { stockComparisonText } from "./stock-comparison-text";

const meanings: Record<
  Locale,
  readonly [string, string, string, string, string]
> = {
  id: [
    "lebih tenang dari pasar",
    "mendekati pasar",
    "lebih bergejolak dari pasar",
    "cukup berbeda arah",
    "sering searah",
  ],
  en: [
    "calmer than the market",
    "close to the market",
    "more volatile than the market",
    "often moves differently",
    "often moves together",
  ],
};

const rounded: Record<Locale, readonly [string, string, string]> = {
  id: ["0,80", "1,20", "0,50"],
  en: ["0.80", "1.20", "0.50"],
};

for (const locale of locales) {
  test(`explains each beta and correlation band at its boundaries in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const [calm, market, volatile, different, same] = meanings[locale];
    expect([
      formatBeta(beta(0.7996)),
      stockComparisonText({ kind: "beta", value: beta(0.7996) }),
      formatBeta(beta(1.2049)),
      stockComparisonText({ kind: "beta", value: beta(1.2049) }),
      formatCorrelation(correlation(0.4996)),
      stockComparisonText({ kind: "correlation", value: correlation(0.4996) }),
    ]).toEqual([
      rounded[locale][0],
      market,
      rounded[locale][1],
      market,
      rounded[locale][2],
      same,
    ]);
    for (const [value, expected] of [
      [-1, calm],
      [0.7949, calm],
      [0.7996, market],
      [0.8, market],
      [1, market],
      [1.2, market],
      [1.2049, market],
      [1.205, volatile],
      [2, volatile],
    ] as const)
      expect(stockComparisonText({ kind: "beta", value: beta(value) })).toBe(
        expected,
      );
    for (const [value, expected] of [
      [-1, different],
      [0, different],
      [0.4949, different],
      [0.4996, same],
      [0.5, same],
      [1, same],
    ] as const)
      expect(
        stockComparisonText({ kind: "correlation", value: correlation(value) }),
      ).toBe(expected);
  });
}
