import { expect, test } from "vitest";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { StockRange } from "./stock-range";
import type { stockPriceRange } from "./stock-price-range";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Rentang 52 minggu",
    "Harga penutupan terendah dan tertinggi yang tersimpan dalam 52 minggu, setelah penyesuaian pemecahan saham, dengan garis pada penutupan tersimpan terbaru.",
    "Penutupan tersimpan dari 2 Jan 2026 sampai 30 Okt 2026 berkisar dari 1.000 sampai 2.000 rupiah per lembar.",
    "MIN = 1.000 pada 2 Jan 2026. MAX = 2.000 pada 30 Okt 2026.",
    "1.000 sampai 2.000",
    "Penutupan tersimpan dari 2 Jan 2026 sampai 30 Okt 2026.",
  ],
  en: [
    "52-week range",
    "The lowest and highest stored closes within 52 weeks, adjusted for stock splits, with the mark on the latest stored close.",
    "Stored closes from Jan 2, 2026 to Oct 30, 2026 range from 1,000 to 2,000 rupiah per share.",
    "MIN = 1,000 on Jan 2, 2026. MAX = 2,000 on Oct 30, 2026.",
    "1,000 to 2,000",
    "Stored closes from Jan 2, 2026 to Oct 30, 2026.",
  ],
};
const noCloses: Record<Locale, string> = {
  id: "Belum ada harga penutupan dalam rentang ini. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan dalam rentang ini.",
  en: "There are no closing prices in this range yet. Check again when a price history update stores closes in this range.",
};

function renderRange(range: ReturnType<typeof stockPriceRange>): string {
  return renderInRouterForTest(
    <dl>
      <StockRange range={range} />
    </dl>,
    conceptLessonDataForTest(),
  );
}

for (const locale of locales) {
  test(`explains the available stored closes, an empty range, and a single close in ${locale}`, () => {
    switchLocaleForTest(locale);
    const low = { date: "2026-01-02", close: splitAdjustedRupiah(1_000) };
    const high = { date: "2026-10-30", close: splitAdjustedRupiah(2_000) };
    const html = renderRange({
      low,
      high,
      first: low.date,
      last: high.date,
      latest: high.close,
    });
    for (const expected of texts[locale])
      expect(html).toContain(markupTextForTest(expected));
    expect(renderRange(undefined)).toContain(
      markupTextForTest(noCloses[locale]),
    );
    const single = renderRange({
      low,
      high: low,
      first: low.date,
      last: low.date,
      latest: low.close,
    });
    expect(single).toContain('x1="50%"');
    expect(single).toContain('x2="50%"');
  });
}
