import { expect, test } from "vitest";
import { attemptForCodes } from "~/features/market-data/quote-failure-text";
import { stockQuote } from "~/features/market-data/stock-quote";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { holdingQuoteFailureText } from "./holding-quote-failure-text";
import type { ValuationReport } from "./read-portfolio-report.server";
import { valuePortfolio } from "./value-portfolio";

// A partial update at 10:30 WIB on Tuesday 3 November 2026, seen half a minute later, which could not fetch TLKM, BBCA, and AMMN. Portolab stored older quotes of BBCA and TLKM, but never one of AMMN.
const attempt: UpdateAttempt = {
  attemptedAt: new Date("2026-11-03T03:30:00Z"),
  succeeded: true,
  consecutiveFailures: 0,
  failedCodes: ["AMMN", "BBCA", "TLKM"],
};
const moment = { now: new Date("2026-11-03T03:30:30Z"), delayMinutes: 10 };
const quotes = new Map([
  ["BBCA", stockQuote("BBCA", [4_840, 4_980], "2026-11-03T02:55:00Z")],
  ["TLKM", stockQuote("TLKM", [1_980, 1_980], "2026-11-03T02:50:00Z")],
]);

/** The valuation of a portfolio of the test that holds the stocks of some codes, with the latest attempt narrowed to them, as readPortfolioValuation narrows it through attemptForCodes. */
function reportForTest(codes: readonly string[]): ValuationReport {
  return {
    valuation: valuePortfolio(
      {
        cash: rupiah(1_000_000),
        holdings: codes.map((code) => ({
          code,
          shares: shares(100),
          cost: rupiah(500_000),
        })),
      },
      rupiah(10_000_000),
      quotes,
    ),
    quoteAttempt: attemptForCodes(attempt, codes),
  };
}

const texts: Record<Locale, string> = {
  id: "Portolab tidak dapat memperbarui harga BBCA dan TLKM pada 3 Nov 2026, 10.30 WIB, jadi Portolab memakai harga terakhir masing-masing yang tersimpan. Portolab belum memiliki harga AMMN, karena percobaan terakhir untuk mengambilnya pada 3 Nov 2026, 10.30 WIB gagal. Portolab mencoba lagi pada 3 Nov 2026, 10.31 WIB.",
  en: "Portolab could not update the prices of BBCA and TLKM at Nov 3, 2026, 10:30 AM WIB, so it uses the last price of each that it stored. Portolab has no price for AMMN yet, because its latest attempt to fetch it at Nov 3, 2026, 10:30 AM WIB failed. Portolab tries again at Nov 3, 2026, 10:31 AM WIB.",
};

for (const locale of locales) {
  test(`names once each price of the holdings of several portfolios that the latest update could not fetch, by code, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(
      holdingQuoteFailureText(
        [
          reportForTest(["TLKM"]),
          reportForTest(["BBCA", "TLKM"]),
          reportForTest(["AMMN"]),
        ],
        moment,
      ),
    ).toBe(texts[locale]);
  });
}

test("names no price when no portfolio holds a stock that the latest update could not fetch", () => {
  expect(holdingQuoteFailureText([reportForTest([])], moment)).toBeUndefined();
  expect(holdingQuoteFailureText([], moment)).toBeUndefined();
});
