import { expect, test } from "vitest";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { writeIntlSpacesForTest } from "./write-intl-spaces-for-test";
import {
  digitGrouping,
  formatList,
  formatMarketClock,
  formatMarketTime,
  formatMarketTimeParts,
  formatCalendarDate,
  formatCalendarDatePart,
  formatMonth,
  formatUtcDay,
  formatMinutes,
  formatBytes,
  axisMarkFormat,
  formatPercentagePoints,
  formatSharpeRatio,
  formatCorrelation,
  formatBeta,
  formatVariance,
  formatPercent,
  formatIndexLevel,
  formatNumber,
  formatSplitAdjustedRupiah,
  formatSignedPercent,
  formatSignedRupiah,
  formatRupiahParts,
  formatRupiah,
} from "./formatting";
import {
  formatFormulaBeta,
  formatFormulaPercent,
} from "./formula-input-formatting";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { beta } from "./units/beta";
import { bytes } from "./units/bytes";
import { correlation } from "./units/correlation";
import { indexPoints } from "./units/index-points";
import { monthlyReturn } from "./units/monthly-return";
import { monthlyVariance } from "./units/monthly-variance";
import { rupiah } from "./units/rupiah";
import { sharpeRatio } from "./units/sharpe-ratio";
import { splitAdjustedRupiah } from "./units/split-adjusted-rupiah";

// 09:13 UTC is 16:13 WIB, whose time of day takes AM or PM in English.
const quotedAt = new Date("2026-11-17T09:13:00Z");

/** A text of each formatter of the app, for values that hold each kind of space that Intl writes: around a currency, a unit, a compact amount, and a sign, and between the words of a date, a time, and a list. */
function formattedTexts(): unknown[] {
  return [
    formatRupiah(rupiah(1_234_567)),
    formatRupiah(rupiah(54_780_000), "compact"),
    formatRupiahParts(rupiah(1_234_567)),
    formatSignedRupiah(rupiah(-1_474_700)),
    formatSignedPercent(0.0081),
    formatSplitAdjustedRupiah(splitAdjustedRupiah(1_234.5)),
    formatNumber(1_234.5678),
    formatIndexLevel(indexPoints(5_057.05)),
    formatPercent(0.001),
    formatVariance(monthlyVariance(0.0027)),
    formatBeta(beta(0.69)),
    formatCorrelation(correlation(-0.25)),
    formatSharpeRatio(sharpeRatio(-0.17)),
    formatPercentagePoints(0.0003),
    axisMarkFormat([0, 0.005], "percent")(0.005),
    formatFormulaPercent(monthlyReturn(0.000002227101)),
    formatFormulaBeta(beta(0.62)),
    formatBytes(bytes(128_040)),
    formatMinutes(10, "short"),
    formatMinutes(10, "long"),
    formatCalendarDate("2026-11-17"),
    formatCalendarDate("2026-11-17", "weekday"),
    formatCalendarDate("2026-11-17", "medium"),
    formatUtcDay(quotedAt),
    formatCalendarDatePart("2026-11-17", "dayAndMonth"),
    formatMonth("2026-11-17", "short"),
    formatMarketTime(quotedAt),
    formatMarketTimeParts(quotedAt),
    formatMarketClock(quotedAt),
    formatList(["BBCA", "TLKM", "ASII"], "disjunction"),
    digitGrouping(),
  ];
}

// The spaces that the data of Intl in another engine can write where Node writes a space, such as the narrow no-break space that CLDR 42 writes before AM or PM in English.
const engineSpaces: Record<string, string> = {
  "a plain space": " ",
  "a no-break space": "\u00a0",
  "a narrow no-break space": "\u202f",
  "a thin space": "\u2009",
};

for (const locale of locales) {
  for (const [name, space] of Object.entries(engineSpaces)) {
    test(`writes every formatted text as it does with the data of Node when the data of Intl writes ${name} for each space, in ${languageNames[locale]}`, () => {
      switchLocaleForTest(locale);
      const textsWithNodeData = formattedTexts();
      const restoreIntl = writeIntlSpacesForTest(space);
      try {
        expect(new Intl.ListFormat("en").format(["one", "two"])).toBe(
          `one${space}and${space}two`,
        );
        expect(formattedTexts()).toEqual(textsWithNodeData);
      } finally {
        restoreIntl();
      }
    });
  }
}

const amountLists: Record<Locale, string> = {
  id: "Rp\u00a04.980 dan Rp\u00a01.980",
  en: "IDR\u00a04,980 and IDR\u00a01,980",
};

for (const locale of locales) {
  test(`keeps the no-break spaces of the amounts in a list, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      formatList(
        [formatRupiah(rupiah(4_980)), formatRupiah(rupiah(1_980))],
        "conjunction",
      ),
    ).toBe(amountLists[locale]);
  });
}
