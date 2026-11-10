import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { fail, succeed } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import {
  measureFailureText,
  shortMeasureFailureText,
} from "./measure-failure-text";
import type { StoredMeasureFailure } from "./measure-stored.server";

// AADI listed in December 2024, so it has 21 returns in the window that ends in September 2026, and forecast-enough-returns.test.ts explains why January 2027 brings enough. A stock that listed in August 2026 has 1 return in that window.
const failures = {
  aadi: {
    kind: "tooFewReturns",
    code: "AADI",
    count: 21,
    minimum: 24,
    enoughAfterFirstTradingDayOf: succeed("2027-01-01"),
  },
  withoutHistory: {
    kind: "tooFewReturns",
    code: "ADMR",
    count: 0,
    minimum: 24,
    enoughAfterFirstTradingDayOf: fail({ code: "ADMR" }),
  },
  oneReturn: {
    kind: "tooFewReturns",
    code: "ITMG",
    count: 1,
    minimum: 24,
    enoughAfterFirstTradingDayOf: succeed("2028-08-01"),
  },
  marketWithoutHistory: {
    kind: "tooFewReturns",
    code: "IHSG",
    count: 0,
    minimum: 24,
    enoughAfterFirstTradingDayOf: fail({ code: "IHSG" }),
  },
  noVariation: { kind: "noVariation", code: "BBCA" },
  noRiskFreeRate: { kind: "noRiskFreeRate", date: "2020-12-31" },
} satisfies Record<string, StoredMeasureFailure>;

const texts: Record<
  Locale,
  {
    aadi: string;
    withoutHistory: string;
    oneReturnOfPortfolio: string;
    marketWithoutHistoryOfPortfolio: string;
    noVariation: string;
    noRiskFreeRate: string;
    shortTooFewReturns: string;
    shortNoVariation: string;
    shortNoRiskFreeRate: string;
  }
> = {
  id: {
    aadi: "AADI dan IHSG baru sama-sama memiliki 21 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung ukuran suatu saham hanya dari paling sedikit 24 imbal hasil bulanan. Jika AADI dan IHSG tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran AADI setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Januari 2027.",
    withoutHistory:
      "ADMR dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung ukuran suatu saham hanya dari paling sedikit 24 imbal hasil bulanan. Portolab belum menyimpan riwayat harga ADMR selama satu bulan penuh, sehingga belum dapat memperkirakan kapan ukurannya tersedia. Portolab dapat memperkirakannya setelah pembaruan riwayat harga berikutnya menyimpan riwayat tersebut.",
    oneReturnOfPortfolio:
      "Saham Anda dan IHSG baru sama-sama memiliki 1 imbal hasil bulanan dalam 60 bulan lengkap terakhir, dan ITMG memiliki imbal hasil paling sedikit, sedangkan Portolab menghitung ukuran portofolio hanya dari paling sedikit 24 imbal hasil bulanan. Jika IHSG dan setiap saham Anda tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung ukuran portofolio Anda setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Agustus 2028.",
    marketWithoutHistoryOfPortfolio:
      "Saham Anda dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, dan IHSG memiliki imbal hasil paling sedikit, sedangkan Portolab menghitung ukuran portofolio hanya dari paling sedikit 24 imbal hasil bulanan. Portolab belum menyimpan riwayat harga IHSG selama satu bulan penuh, sehingga belum dapat memperkirakan kapan ukurannya tersedia. Portolab dapat memperkirakannya setelah pembaruan riwayat harga berikutnya menyimpan riwayat tersebut.",
    noVariation:
      "BBCA memiliki imbal hasil yang sama di setiap bulan ukuran ini, sehingga variansnya nol, dan korelasi dengannya akan membagi dengan nol. Portolab menghitung ukurannya setelah pembaruan riwayat harga menyimpan harga penutupan suatu bulan yang memberi BBCA imbal hasil lain.",
    noRiskFreeRate:
      "BI-Rate pada atau sebelum 31 Desember 2020, akhir bulan terakhir dari imbal hasil tersebut, belum tercatat di Portolab, sehingga ukurannya belum memiliki suku bunga bebas risiko. Beri tahu dosen Anda agar BI-Rate hari itu dapat ditambahkan.",
    shortTooFewReturns: "21 dari 24 imbal hasil bulanan yang dibutuhkan ukuran",
    shortNoVariation: "Imbal hasil BBCA sama di setiap bulan",
    shortNoRiskFreeRate:
      "BI-Rate pada atau sebelum 31 Desember 2020 belum tercatat",
  },
  en: {
    aadi: "AADI and the IHSG share 21 monthly returns in the latest 60 complete months, but Portolab computes the measures of a stock only from at least 24 monthly returns. If AADI and the IHSG keep a close at the end of every month, Portolab computes the measures of AADI after the update of the price history that stores the close of the first trading day of January 2027.",
    withoutHistory:
      "ADMR and the IHSG share 0 monthly returns in the latest 60 complete months, but Portolab computes the measures of a stock only from at least 24 monthly returns. Portolab has not stored a complete month of the price history of ADMR yet, so it cannot tell when the measures come. It can tell once the next update of the price history stores that history.",
    oneReturnOfPortfolio:
      "Your stocks and the IHSG share 1 monthly return in the latest 60 complete months, and ITMG has the fewest returns, but Portolab computes the measures of a portfolio only from at least 24 monthly returns. If the IHSG and each of your stocks keep a close at the end of every month, Portolab computes the measures of your portfolio after the update of the price history that stores the close of the first trading day of August 2028.",
    marketWithoutHistoryOfPortfolio:
      "Your stocks and the IHSG share 0 monthly returns in the latest 60 complete months, and IHSG has the fewest returns, but Portolab computes the measures of a portfolio only from at least 24 monthly returns. Portolab has not stored a complete month of the price history of IHSG yet, so it cannot tell when the measures come. It can tell once the next update of the price history stores that history.",
    noVariation:
      "BBCA has the same return in every month of the measures, so its variance is zero, and a correlation with it would divide by zero. Portolab computes the measures after an update of the price history stores the close of a month that gives BBCA another return.",
    noRiskFreeRate:
      "Portolab has not recorded a BI-Rate on or before December 31, 2020, the end of the last month of the returns, so the measures have no risk-free rate. Tell your lecturer, so that the BI-Rate of that day can be added.",
    shortTooFewReturns: "21 of the 24 monthly returns that the measures need",
    shortNoVariation: "BBCA has the same return in every month",
    shortNoRiskFreeRate:
      "No BI-Rate is recorded on or before December 31, 2020",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`explains too few returns of a stock with the month that brings enough, or without it while a stock has no stored history, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      measureFailureText(failures.aadi, { kind: "stock", code: "AADI" }),
    ).toBe(text.aadi);
    expect(
      measureFailureText(failures.withoutHistory, {
        kind: "stock",
        code: "ADMR",
      }),
    ).toBe(text.withoutHistory);
  });

  test(`explains too few returns of a portfolio, names the instrument with the fewest, and gives the month that brings enough, or says that the IHSG has no stored history, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(measureFailureText(failures.oneReturn, { kind: "portfolio" })).toBe(
      text.oneReturnOfPortfolio,
    );
    expect(
      measureFailureText(failures.marketWithoutHistory, { kind: "portfolio" }),
    ).toBe(text.marketWithoutHistoryOfPortfolio);
  });

  test(`explains returns without variation and a missing BI-Rate alike for a stock and a portfolio, in ${language}`, () => {
    switchLocaleForTest(locale);
    for (const subject of [
      { kind: "stock", code: "BBCA" },
      { kind: "portfolio" },
    ] as const) {
      expect(measureFailureText(failures.noVariation, subject)).toBe(
        text.noVariation,
      );
      expect(measureFailureText(failures.noRiskFreeRate, subject)).toBe(
        text.noRiskFreeRate,
      );
    }
  });

  test(`says in short why a stock has no measures, for a cell of the table of every stock, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(shortMeasureFailureText(failures.aadi)).toBe(
      text.shortTooFewReturns,
    );
    expect(shortMeasureFailureText(failures.noVariation)).toBe(
      text.shortNoVariation,
    );
    expect(shortMeasureFailureText(failures.noRiskFreeRate)).toBe(
      text.shortNoRiskFreeRate,
    );
  });
}
