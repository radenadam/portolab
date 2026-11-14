import type { ClassId } from "~/features/classes/classes.schema";
import { expect, test } from "vitest";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import { readStockMeasures } from "~/features/measures/read-measures.server";
import { readStockCorrelation } from "~/features/measures/read-stock-correlation.server";
import { StockKeyMeasures } from "~/features/measures/stock-key-measures";
import { StockPosition } from "~/features/trading/stock-position";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { shares } from "~/units/shares";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { StockRange } from "./stock-range";

const texts: Record<
  Locale,
  {
    range: readonly string[];
    position: readonly string[];
    correlation: readonly string[];
    period: readonly string[];
  }
> = {
  id: {
    period: [
      "Beta terhadap IHSG, Simpangan baku, dan Imbal hasil yang diharapkan memakai 60 imbal hasil bulanan dari Oktober 2021 sampai September 2026.",
      "60 imbal hasil bulanan · Oktober 2021 sampai September 2026",
      "Bobot portofolio memakai harga tertunda. Halaman portofolio Anda menunjukkan waktu kutipan setiap harga.",
    ],
    range: [
      "Rentang 52 minggu",
      "Harga penutupan terendah dan tertinggi yang tersimpan dalam 52 minggu, setelah penyesuaian pemecahan saham, dengan garis pada penutupan tersimpan terbaru.",
      "Penutupan tersimpan dari 2 Jan 2026 sampai 30 Okt 2026 berkisar dari 1.000 sampai 2.000 rupiah per lembar.",
      "MIN = 1.000 pada 2 Jan 2026. MAX = 2.000 pada 30 Okt 2026.",
      "1.000 sampai 2.000",
      "Penutupan tersimpan dari 2 Jan 2026 sampai 30 Okt 2026.",
    ],
    position: [
      "Harga rata-rata",
      "Harga rata-rata membagi biaya saham yang masih Anda miliki, termasuk biaya broker pembelian, dengan jumlah lembarnya.",
      "Rp 27.431.085 / 5.500 saham = Rp 4.987 per lembar, dibulatkan ke rupiah terdekat.",
      "Laba atau rugi belum terealisasi adalah nilai saham pada harga tertunda dikurangi biaya pembeliannya, termasuk biaya broker.",
      "Rp 27.390.000 − Rp 27.431.085 = -Rp 41.085.",
      "Rp 4.987",
      "Rp 27.390.000",
      "-Rp 41.085",
      "-0,15%",
    ],
    correlation: [
      "Korelasi dengan portofolio",
      "Korelasi mengukur gerak bersama imbal hasil saham dan portofolio pada bulan yang sama, dari −1 sampai 1.",
      "Saham ini, setiap saham portofolio Anda, dan IHSG berbagi 21 imbal hasil bulanan, tetapi korelasi memerlukan sedikitnya 24 imbal hasil bulanan. Portolab menghitungnya saat pembaruan riwayat harga menyediakan cukup imbal hasil pada bulan yang sama.",
    ],
  },
  en: {
    period: [
      "Beta against the IHSG, Standard deviation, and Expected return use 60 monthly returns from October 2021 to September 2026.",
      "60 monthly returns · October 2021 to September 2026",
      "Portfolio weights use delayed prices. Your portfolio page shows when each price was quoted.",
    ],
    range: [
      "52-week range",
      "The lowest and highest stored closes within 52 weeks, adjusted for stock splits, with the mark on the latest stored close.",
      "Stored closes from Jan 2, 2026 to Oct 30, 2026 range from 1,000 to 2,000 rupiah per share.",
      "MIN = 1,000 on Jan 2, 2026. MAX = 2,000 on Oct 30, 2026.",
      "1,000 to 2,000",
      "Stored closes from Jan 2, 2026 to Oct 30, 2026.",
    ],
    position: [
      "Average cost",
      "Average cost divides the cost of the shares you still hold, including purchase broker fees, by their share count.",
      "IDR 27,431,085 / 5,500 shares = IDR 4,987 per share, rounded to the nearest rupiah.",
      "Unrealised profit or loss is the value of the shares at the delayed price less their purchase cost, including broker fees.",
      "IDR 27,390,000 − IDR 27,431,085 = -IDR 41,085.",
      "IDR 4,987",
      "IDR 27,390,000",
      "-IDR 41,085",
      "-0.15%",
    ],
    correlation: [
      "Correlation with portfolio",
      "Correlation measures how stock and portfolio returns move together over the same months, from −1 to 1.",
      "This stock, each stock in your portfolio, and the IHSG share 21 monthly returns, but correlation needs at least 24 monthly returns. Portolab computes it when a price history update provides enough returns over the same months.",
    ],
  },
};

for (const locale of locales) {
  test(`explains the stored-close range, the cost, and the unavailable correlation in ${locale}`, () => {
    switchLocaleForTest(locale);
    const database = databaseWithClosesForTest();
    const valuation = valuationForTest(["BBCA", "TLKM"]);
    const holding = valuation.holdings[0];
    if (holding === undefined) throw new Error("The fixture holds BBCA.");
    const html = renderInRouterForTest(
      <>
        <dl>
          <StockRange
            range={{
              low: { date: "2026-01-02", close: splitAdjustedRupiah(1_000) },
              high: { date: "2026-10-30", close: splitAdjustedRupiah(2_000) },
              first: "2026-01-02",
              last: "2026-10-30",
              latest: splitAdjustedRupiah(2_000),
            }}
          />
        </dl>
        <StockPosition holding={holding} lotShares={shares(100)} />
        <StockKeyMeasures
          classId={7 as ClassId}
          code="AADI"
          measures={readStockMeasures(database, "AADI")}
          correlation={readStockCorrelation(database, "AADI", valuation)}
        >
          {null}
        </StockKeyMeasures>
      </>,
      conceptLessonDataForTest(),
    ).replaceAll("\u00a0", " ");
    const measured = renderInRouterForTest(
      <StockKeyMeasures
        classId={7 as ClassId}
        code="BBCA"
        measures={readStockMeasures(database, "BBCA")}
        correlation={readStockCorrelation(database, "BBCA", valuation)}
      >
        {null}
      </StockKeyMeasures>,
      conceptLessonDataForTest(),
    );
    for (const expected of texts[locale].period)
      expect(measured).toContain(markupTextForTest(expected));
    // ROUND of the recorded purchase cost per share is Rp4,987, and the quote leaves a loss of Rp41,085 or 0.149775% of cost, as Python's decimal module computed.
    for (const expected of [
      ...texts[locale].range,
      ...texts[locale].position,
      ...texts[locale].correlation,
    ]) {
      expect(html).toContain(markupTextForTest(expected));
    }
  });
}
