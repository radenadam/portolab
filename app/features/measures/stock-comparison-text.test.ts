import { expect, test } from "vitest";
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

for (const locale of locales) {
  test(`explains each beta and correlation band at its boundaries in ${locale}`, () => {
    switchLocaleForTest(locale);
    const [calm, market, volatile, different, same] = meanings[locale];
    for (const [value, expected] of [
      [-1, calm],
      [0.799, calm],
      [0.8, market],
      [1, market],
      [1.2, market],
      [1.201, volatile],
      [2, volatile],
    ] as const)
      expect(stockComparisonText({ kind: "beta", value: beta(value) })).toBe(
        expected,
      );
    for (const [value, expected] of [
      [-1, different],
      [0, different],
      [0.499, different],
      [0.5, same],
      [1, same],
    ] as const)
      expect(
        stockComparisonText({ kind: "correlation", value: correlation(value) }),
      ).toBe(expected);
  });
}
