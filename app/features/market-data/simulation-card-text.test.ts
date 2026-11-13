import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import type { PriceSourceDescription } from "./price-source.server";
import {
  attemptInStateForTest,
  halfMinuteAfterForTest,
  nextAttemptSentencesForTest,
  nextAttemptTimeForTest,
  sessionStateForTest,
} from "./schedule-states-for-test";
import { simulationCardText } from "./simulation-card-text";
import { stockQuote } from "./stock-quote";

const source: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};

// The latest quote of BBCA came at 09:59 WIB, before the attempt of the state of a session at 10:00 WIB, and BBRI an hour earlier.
const quotes = [
  stockQuote("BBCA", [9_350, 9_275], "2026-11-02T02:59:00.000Z"),
  stockQuote("BBRI", [4_120, 4_100], "2026-11-02T01:59:00.000Z"),
];

const now = halfMinuteAfterForTest(sessionStateForTest);

const texts: Record<
  Locale,
  {
    simulation: string;
    latestPrice: string;
    firstPrices: string;
    emptyFailed: string;
    staleAndMissing: string;
    severalStale: string;
    updateFailed: string;
  }
> = {
  id: {
    simulation:
      "Uang di Portolab virtual, jadi setiap hasil adalah simulasi. Setiap harga adalah harga tertunda dari Yahoo Finance, sekitar 10 menit di belakang BEI.",
    latestPrice: "Harga terakhir tercatat pada 2 Nov 2026, 09.59 WIB.",
    firstPrices:
      "Portolab sedang mengambil harga pertamanya. Muat ulang halaman ini sebentar lagi untuk melihatnya.",
    emptyFailed:
      "Portolab belum memiliki harga, karena percobaan terakhir untuk mengambilnya pada 2 Nov 2026, 10.00 WIB gagal.",
    staleAndMissing:
      "Portolab tidak dapat memperbarui harga BBCA pada 2 Nov 2026, 10.00 WIB, jadi Portolab memakai harga terakhir BBCA yang tersimpan. Portolab belum memiliki harga WIFI, karena percobaan terakhir untuk mengambilnya pada 2 Nov 2026, 10.00 WIB gagal.",
    severalStale:
      "Portolab tidak dapat memperbarui harga BBCA dan BBRI pada 2 Nov 2026, 10.00 WIB, jadi Portolab memakai harga terakhir masing-masing yang tersimpan.",
    updateFailed:
      "Portolab tidak dapat memperbarui harga pada 2 Nov 2026, 10.00 WIB, jadi Portolab memakai harga terakhir yang tersimpan.",
  },
  en: {
    simulation:
      "The money in Portolab is virtual, so every result is a simulation. Every price is a delayed price from Yahoo Finance, about 10 minutes behind IDX.",
    latestPrice: "The latest price was quoted at Nov 2, 2026, 9:59 AM WIB.",
    firstPrices:
      "Portolab is fetching its first prices now. Reload this page in a moment to see them.",
    emptyFailed:
      "Portolab has no prices yet, because its latest attempt to fetch them at Nov 2, 2026, 10:00 AM WIB failed.",
    staleAndMissing:
      "Portolab could not update the price of BBCA at Nov 2, 2026, 10:00 AM WIB, so it uses the last price of BBCA that it stored. Portolab has no price for WIFI yet, because its latest attempt to fetch it at Nov 2, 2026, 10:00 AM WIB failed.",
    severalStale:
      "Portolab could not update the prices of BBCA and BBRI at Nov 2, 2026, 10:00 AM WIB, so it uses the last price of each that it stored.",
    updateFailed:
      "Portolab could not update the prices at Nov 2, 2026, 10:00 AM WIB, so it uses the last prices that it stored.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];
  const nextAttempt = (succeeded: boolean): string =>
    nextAttemptSentencesForTest[locale](
      nextAttemptTimeForTest(sessionStateForTest, succeeded, locale),
    );

  test(`says that every result is a simulation of delayed prices and that Portolab is fetching its first prices before its first attempt, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(simulationCardText([], undefined, { now, source })).toEqual([
      text.simulation,
      text.firstPrices,
    ]);
  });

  test(`says why Portolab has no price yet after a failed attempt, and when it tries again, without naming each price, in ${language}`, () => {
    switchLocaleForTest(locale);
    const attempt = attemptInStateForTest(sessionStateForTest, {
      succeeded: false,
      failedCodes: ["BBCA", "WIFI"],
    });
    expect(simulationCardText([], attempt, { now, source })).toEqual([
      text.simulation,
      `${text.emptyFailed} ${nextAttempt(false)}`,
    ]);
  });

  test(`gives the time of the latest price after an attempt that updated every price, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const attempt of [
      undefined,
      attemptInStateForTest(sessionStateForTest, {
        succeeded: true,
        failedCodes: [],
      }),
    ]) {
      expect(simulationCardText(quotes, attempt, { now, source })).toEqual([
        text.simulation,
        text.latestPrice,
      ]);
    }
  });

  test(`names a stored price that the latest attempt missed and a price that Portolab never stored, and when the job tries again, in ${language}`, () => {
    switchLocaleForTest(locale);
    const attempt = attemptInStateForTest(sessionStateForTest, {
      succeeded: true,
      failedCodes: ["BBCA", "WIFI"],
    });
    expect(simulationCardText(quotes, attempt, { now, source })).toEqual([
      text.simulation,
      text.latestPrice,
      `${text.staleAndMissing} ${nextAttempt(true)}`,
    ]);
  });

  test(`names several stored prices that the latest attempt missed, in ${language}`, () => {
    switchLocaleForTest(locale);
    const attempt = attemptInStateForTest(sessionStateForTest, {
      succeeded: true,
      failedCodes: ["BBCA", "BBRI"],
    });
    expect(simulationCardText(quotes, attempt, { now, source })).toEqual([
      text.simulation,
      text.latestPrice,
      `${text.severalStale} ${nextAttempt(true)}`,
    ]);
  });

  test(`says that the latest attempt updated no price after it failed, and that Portolab uses the stored prices, in ${language}`, () => {
    switchLocaleForTest(locale);
    const attempt = attemptInStateForTest(sessionStateForTest, {
      succeeded: false,
      failedCodes: ["BBCA", "BBRI"],
    });
    expect(simulationCardText(quotes, attempt, { now, source })).toEqual([
      text.simulation,
      text.latestPrice,
      `${text.updateFailed} ${nextAttempt(false)}`,
    ]);
  });
}
