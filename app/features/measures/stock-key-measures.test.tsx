import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { fail, succeed } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { readStockMeasures } from "./read-measures.server";
import { readStockCorrelation } from "./read-stock-correlation.server";
import type { StockCorrelation } from "./read-stock-correlation.server";
import { StockKeyMeasures } from "./stock-key-measures";

const failures = {
  noHoldings: { kind: "noHoldings" },
  unpricedOne: { kind: "unpriced", codes: ["BBCA"] },
  unpricedSeveral: { kind: "unpriced", codes: ["BBCA", "TLKM"] },
  noPortfolioVariation: { kind: "noPortfolioVariation" },
  noStockVariation: {
    kind: "unmeasured",
    failure: { kind: "noVariation", code: "BBCA" },
  },
  noMarketVariation: {
    kind: "unmeasured",
    failure: { kind: "noVariation", code: "IHSG" },
  },
  noRiskFreeRate: {
    kind: "unmeasured",
    failure: { kind: "noRiskFreeRate", date: "2020-12-31" },
  },
  tooFewSeveral: {
    kind: "unmeasured",
    failure: {
      kind: "tooFewReturns",
      code: "AADI",
      count: 21,
      minimum: 24,
      enoughAfterFirstTradingDayOf: succeed("2027-01-01"),
    },
  },
  tooFewOne: {
    kind: "unmeasured",
    failure: {
      kind: "tooFewReturns",
      code: "ITMG",
      count: 1,
      minimum: 24,
      enoughAfterFirstTradingDayOf: succeed("2028-08-01"),
    },
  },
  noHistorySeveral: {
    kind: "unmeasured",
    failure: {
      kind: "tooFewReturns",
      code: "ADMR",
      count: 0,
      minimum: 24,
      enoughAfterFirstTradingDayOf: fail({ code: "ADMR" }),
    },
  },
  noHistoryOne: {
    kind: "unmeasured",
    failure: {
      kind: "tooFewReturns",
      code: "IHSG",
      count: 1,
      minimum: 24,
      enoughAfterFirstTradingDayOf: fail({ code: "IHSG" }),
    },
  },
} satisfies Record<string, Extract<StockCorrelation, { ok: false }>["failure"]>;

const periods: Record<Locale, readonly string[]> = {
  id: [
    "Beta terhadap IHSG, Simpangan baku, dan Imbal hasil yang diharapkan memakai 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
    "60 imbal hasil bulanan · Oktober 2021 sampai September 2026",
    "Bobot portofolio memakai harga tertunda. Halaman portofolio Anda menunjukkan waktu kutipan setiap harga.",
  ],
  en: [
    "Beta against the IHSG, Standard deviation, and Expected return use 60 monthly returns from October 2021 to September 2026.",
    "60 monthly returns · October 2021 to September 2026",
    "Portfolio weights use delayed prices. Your portfolio page shows when each price was quoted.",
  ],
};

const failureTexts: Record<Locale, Record<keyof typeof failures, string>> = {
  id: {
    noHoldings:
      "Anda belum memegang saham, sehingga portofolio Anda hanya berisi kas, yang tidak menghasilkan imbal hasil di Portolab. Portolab menghitung ukuran portofolio Anda setelah order beli Anda tereksekusi.",
    unpricedOne:
      "Portolab menghitung ukuran portofolio Anda setelah pembaruan harga berikutnya membawa harga tertunda BBCA, karena bobot setiap saham adalah nilainya pada harga tertundanya.",
    unpricedSeveral:
      "Portolab menghitung ukuran portofolio Anda setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM, karena bobot setiap saham adalah nilainya pada harga tertundanya.",
    noPortfolioVariation:
      "Imbal hasil portofolio sama di setiap bulan, sehingga varians dan simpangan bakunya nol, dan ukuran yang membagi dengan keduanya tidak memiliki nilai. Portolab menghitung ukuran seperti itu setelah suatu order tereksekusi atau pembaruan riwayat harga memberi portofolio imbal hasil yang berbeda dari bulan ke bulan.",
    noStockVariation:
      "Imbal hasil BBCA sama di setiap bulan ukuran ini, sehingga variansnya nol, dan korelasi dengannya akan membagi dengan nol. Portolab menghitung ukurannya setelah pembaruan riwayat harga menyimpan harga penutupan suatu bulan yang memberi BBCA imbal hasil lain.",
    noMarketVariation:
      "Imbal hasil IHSG sama di setiap bulan ukuran ini, sehingga variansnya nol, dan korelasi dengannya akan membagi dengan nol. Portolab menghitung ukurannya setelah pembaruan riwayat harga menyimpan harga penutupan suatu bulan yang memberi IHSG imbal hasil lain.",
    noRiskFreeRate:
      "BI-Rate pada atau sebelum 31 Desember 2020, akhir bulan terakhir dari imbal hasil tersebut, belum tercatat di Portolab, sehingga ukurannya belum memiliki suku bunga bebas risiko. Beri tahu dosen Anda agar BI-Rate hari itu dapat ditambahkan.",
    tooFewSeveral:
      "Saham ini, setiap saham portofolio Anda, dan IHSG baru sama-sama memiliki 21 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung korelasi hanya dari paling sedikit 24 imbal hasil bulanan. Jika saham ini, IHSG, dan setiap saham Anda tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung korelasi setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Januari 2027.",
    tooFewOne:
      "Saham ini, setiap saham portofolio Anda, dan IHSG baru sama-sama memiliki 1 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung korelasi hanya dari paling sedikit 24 imbal hasil bulanan. Jika saham ini, IHSG, dan setiap saham Anda tetap memiliki harga penutupan di akhir setiap bulan, Portolab menghitung korelasi setelah pembaruan riwayat harga yang menyimpan harga penutupan hari bursa pertama Agustus 2028.",
    noHistorySeveral:
      "Saham ini, setiap saham portofolio Anda, dan IHSG baru sama-sama memiliki 0 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung korelasi hanya dari paling sedikit 24 imbal hasil bulanan. Portolab belum menyimpan riwayat harga ADMR selama satu bulan penuh, sehingga belum dapat memperkirakan kapan ukurannya tersedia. Portolab dapat memperkirakannya setelah pembaruan riwayat harga berikutnya menyimpan riwayat tersebut.",
    noHistoryOne:
      "Saham ini, setiap saham portofolio Anda, dan IHSG baru sama-sama memiliki 1 imbal hasil bulanan dalam 60 bulan lengkap terakhir, sedangkan Portolab menghitung korelasi hanya dari paling sedikit 24 imbal hasil bulanan. Portolab belum menyimpan riwayat harga IHSG selama satu bulan penuh, sehingga belum dapat memperkirakan kapan ukurannya tersedia. Portolab dapat memperkirakannya setelah pembaruan riwayat harga berikutnya menyimpan riwayat tersebut.",
  },
  en: {
    noHoldings:
      "You hold no shares yet, so your portfolio is cash alone, which earns no return in Portolab. Portolab computes the measures of your portfolio once a purchase of yours fills.",
    unpricedOne:
      "Portolab computes the measures of your portfolio once the next update of prices brings a delayed price of BBCA, because the weight of each stock is its value at its delayed price.",
    unpricedSeveral:
      "Portolab computes the measures of your portfolio once the next update of prices brings the delayed prices of BBCA and TLKM, because the weight of each stock is its value at its delayed price.",
    noPortfolioVariation:
      "The returns of the portfolio are the same in every month, so its variance and its standard deviation are zero, and a measure that divides by them has no value. Portolab computes such a measure once an order fills or an update of the price history gives the portfolio returns that differ from month to month.",
    noStockVariation:
      "The returns of BBCA are the same in every month of the measures, so their variance is zero, and a correlation with them would divide by zero. Portolab computes the measures after an update of the price history stores the close of a month that gives BBCA another return.",
    noMarketVariation:
      "The returns of the IHSG are the same in every month of the measures, so their variance is zero, and a correlation with them would divide by zero. Portolab computes the measures after an update of the price history stores the close of a month that gives the IHSG another return.",
    noRiskFreeRate:
      "Portolab has not recorded a BI-Rate on or before December 31, 2020, the end of the last month of the returns, so the measures have no risk-free rate. Tell your lecturer, so that the BI-Rate of that day can be added.",
    tooFewSeveral:
      "This stock, each stock in your portfolio, and the IHSG share 21 monthly returns in the latest 60 complete months, but Portolab computes correlation only from at least 24 monthly returns. If this stock, the IHSG, and each of your stocks keep a close at the end of every month, Portolab computes correlation after the update of the price history that stores the close of the first trading day of January 2027.",
    tooFewOne:
      "This stock, each stock in your portfolio, and the IHSG share 1 monthly return in the latest 60 complete months, but Portolab computes correlation only from at least 24 monthly returns. If this stock, the IHSG, and each of your stocks keep a close at the end of every month, Portolab computes correlation after the update of the price history that stores the close of the first trading day of August 2028.",
    noHistorySeveral:
      "This stock, each stock in your portfolio, and the IHSG share 0 monthly returns in the latest 60 complete months, but Portolab computes correlation only from at least 24 monthly returns. Portolab has not stored a complete month of the price history of ADMR yet, so it cannot tell when the measures come. It can tell once the next update of the price history stores that history.",
    noHistoryOne:
      "This stock, each stock in your portfolio, and the IHSG share 1 monthly return in the latest 60 complete months, but Portolab computes correlation only from at least 24 monthly returns. Portolab has not stored a complete month of the price history of the IHSG yet, so it cannot tell when the measures come. It can tell once the next update of the price history stores that history.",
  },
};

const meanings: Record<Locale, string> = {
  id: "Korelasi mengukur gerak bersama imbal hasil saham dan portofolio pada bulan yang sama, dari −1 sampai 1.",
  en: "Correlation measures how stock and portfolio returns move together over the same months, from −1 to 1.",
};

const labels: Record<Locale, string> = {
  id: "Korelasi dengan portofolio",
  en: "Correlation with portfolio",
};

for (const locale of locales) {
  test(`shows the periods and every correlation failure with its forecast and next step in ${locale}`, () => {
    switchLocaleForTest(locale);
    const database = databaseWithClosesForTest();
    const measures = readStockMeasures(database, "BBCA");
    function renderCorrelation(correlation: StockCorrelation): string {
      return renderInRouterForTest(
        <StockKeyMeasures
          classId={7 as ClassId}
          code="BBCA"
          measures={measures}
          correlation={correlation}
        >
          {null}
        </StockKeyMeasures>,
        conceptLessonDataForTest(),
      );
    }
    const measured = renderCorrelation(
      readStockCorrelation(
        database,
        "BBCA",
        valuationForTest(["BBCA", "TLKM"]),
      ),
    );
    for (const expected of [
      ...periods[locale],
      meanings[locale],
      labels[locale],
    ])
      expect(measured).toContain(markupTextForTest(expected));
    for (const state in failures) {
      const key = state as keyof typeof failures;
      const html = renderCorrelation(fail(failures[key]));
      expect(html).toContain(markupTextForTest(failureTexts[locale][key]));
    }
  });
}
