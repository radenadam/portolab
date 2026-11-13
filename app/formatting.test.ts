import { expect, test } from "vitest";
import {
  formatBeta,
  formatBytes,
  formatCalendarDate,
  formatCalendarDatePart,
  formatCorrelation,
  formatMarketTime,
  formatMarketTimeParts,
  formatPercent,
  formatSharpeRatio,
  formatSignedPercent,
  formatSignedRupiah,
  formatUtcDay,
  formatVariance,
} from "./formatting";
import { languageNames } from "./language-names";
import { locales } from "./paraglide/runtime.js";
import type { Locale } from "./paraglide/runtime.js";
import { switchLocaleForTest } from "./switch-locale-for-test";
import { beta } from "./units/beta";
import { bytes } from "./units/bytes";
import { correlation } from "./units/correlation";
import { monthlyVariance } from "./units/monthly-variance";
import { rupiah } from "./units/rupiah";
import { sharpeRatio } from "./units/sharpe-ratio";

// 09:14:56 UTC on 16 October 2026 is 16:14 WIB.
const quotedAt = new Date("2026-10-16T09:14:56.000Z");

const sizes: Record<Locale, string> = {
  id: "128.040 byte",
  en: "128,040 bytes",
};

const parts: Record<Locale, { date: string; clock: string }> = {
  id: { date: "16 Okt 2026, ", clock: "16.14" },
  en: { date: "Oct 16, 2026, ", clock: "4:14 PM" },
};

for (const locale of locales) {
  test(`splits a moment where the time of day starts, with the separator of the language, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const split = formatMarketTimeParts(quotedAt);
    expect(split).toEqual(parts[locale]);
    expect(split.date + split.clock).toBe(formatMarketTime(quotedAt));
  });
}

for (const locale of locales) {
  test(`formats a size in bytes in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(formatBytes(bytes(128_040))).toBe(sizes[locale]);
  });
}

const signedAmounts: Record<
  Locale,
  {
    gain: string;
    loss: string;
    none: string;
    percentGain: string;
    percentLoss: string;
    percentNone: string;
    tickGain: string;
    tickLoss: string;
  }
> = {
  id: {
    gain: "+Rp\u00a08.521.000",
    loss: "-Rp\u00a01.474.700",
    none: "Rp\u00a00",
    percentGain: "+0,81%",
    percentLoss: "-2,00%",
    percentNone: "0,00%",
    tickGain: "+0,5%",
    tickLoss: "-2%",
  },
  en: {
    gain: "+IDR\u00a08,521,000",
    loss: "-IDR\u00a01,474,700",
    none: "IDR\u00a00",
    percentGain: "+0.81%",
    percentLoss: "-2.00%",
    percentNone: "0.00%",
    tickGain: "+0.5%",
    tickLoss: "-2%",
  },
};

const dates: Record<
  Locale,
  {
    long: string;
    weekday: string;
    oneDigitDay: string;
    longYear: string;
    medium: string;
    year: string;
    dayAndMonth: string;
  }
> = {
  id: {
    long: "30 Oktober 2026",
    weekday: "Jumat, 30 Oktober 2026",
    oneDigitDay: "Senin, 2 November 2026",
    longYear: "7 September 202666",
    medium: "30 Okt 2026",
    year: "2026",
    dayAndMonth: "30 Okt",
  },
  en: {
    long: "October 30, 2026",
    weekday: "Friday, October 30, 2026",
    oneDigitDay: "Monday, November 2, 2026",
    longYear: "September 7, 202666",
    medium: "Oct 30, 2026",
    year: "2026",
    dayAndMonth: "Oct 30",
  },
};

for (const locale of locales) {
  test(`formats a gain and a loss with their signs and directions, and an amount or a percentage that is zero or rounds to zero without either, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = signedAmounts[locale];
    expect(formatSignedPercent(0.0081)).toEqual({
      text: text.percentGain,
      direction: "rise",
    });
    expect(formatSignedPercent(-0.02)).toEqual({
      text: text.percentLoss,
      direction: "fall",
    });
    expect(formatSignedPercent(-0.00004)).toEqual({
      text: text.percentNone,
      direction: "none",
    });
    expect(formatSignedPercent(0.005, "upToTwo")).toEqual({
      text: text.tickGain,
      direction: "rise",
    });
    expect(formatSignedPercent(-0.02, "upToTwo")).toEqual({
      text: text.tickLoss,
      direction: "fall",
    });
    expect(formatSignedRupiah(rupiah(8_521_000))).toEqual({
      text: text.gain,
      direction: "rise",
    });
    expect(formatSignedRupiah(rupiah(-1_474_700))).toEqual({
      text: text.loss,
      direction: "fall",
    });
    expect(formatSignedRupiah(rupiah(0))).toEqual({
      text: text.none,
      direction: "none",
    });
  });

  test(`formats a calendar date in a sentence, with its day of the week, in a table, and in the parts that a heading and a time axis show, and a day of a year of six digits, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = dates[locale];
    expect(formatCalendarDate("2026-10-30")).toBe(text.long);
    expect(formatCalendarDate("2026-10-30", "weekday")).toBe(text.weekday);
    expect(formatCalendarDate("2026-11-02", "weekday")).toBe(text.oneDigitDay);
    expect(formatCalendarDate("2026-10-30", "medium")).toBe(text.medium);
    const farDay = new Date(0);
    farDay.setUTCFullYear(202666, 8, 7);
    expect(formatUtcDay(farDay)).toBe(text.longYear);
    expect(formatCalendarDatePart("2026-10-30", "year")).toBe(text.year);
    expect(formatCalendarDatePart("2026-10-30", "dayAndMonth")).toBe(
      text.dayAndMonth,
    );
  });
}

const measureValues: Record<
  Locale,
  {
    upToTwo: string;
    two: string;
    variance: string;
    smallVariance: string;
    beta: string;
    correlation: string;
    sharpeRatio: string;
  }
> = {
  id: {
    upToTwo: "0,1%",
    two: "-0,10%",
    variance: "0,002732",
    smallVariance: "-0,00007039",
    beta: "0,69",
    correlation: "-0,25",
    sharpeRatio: "-0,17",
  },
  en: {
    upToTwo: "0.1%",
    two: "-0.10%",
    variance: "0.002732",
    smallVariance: "-0.00007039",
    beta: "0.69",
    correlation: "-0.25",
    sharpeRatio: "-0.17",
  },
};

for (const locale of locales) {
  test(`formats a percentage with up to two decimals or exactly two, a variance with four significant digits, and a beta, a correlation, and a Sharpe ratio with two decimals, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const text = measureValues[locale];
    expect(formatPercent(0.001)).toBe(text.upToTwo);
    expect(formatPercent(-0.0010226485841997692, "two")).toBe(text.two);
    expect(formatVariance(monthlyVariance(0.0027323758291948595))).toBe(
      text.variance,
    );
    expect(formatVariance(monthlyVariance(-7.03867487764213e-5))).toBe(
      text.smallVariance,
    );
    expect(formatBeta(beta(0.6893713956004657))).toBe(text.beta);
    expect(formatCorrelation(correlation(-0.2501))).toBe(text.correlation);
    expect(formatSharpeRatio(sharpeRatio(-0.17094998531994998))).toBe(
      text.sharpeRatio,
    );
  });
}
