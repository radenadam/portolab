import { databaseContext } from "~/database/database.server";
import { indexDailyCloses, indexQuotes } from "./market-data.schema";
import { saveDailyHistory, listIndexHistory } from "./history-store.server";
import { MarketMeasureHelp } from "./market-measure-help";
import type { ComponentProps } from "react";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { expect, test } from "vitest";
import {
  renderMarketForTest,
  marketViewPropsForTest,
} from "./market-view-for-test";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { defaultMarketFilters } from "./market-filters";
import { marketContextForTest } from "./market-context-for-test.server";
import type { MarketView } from "./market-view";
import { readMarket } from "./read-market.server";

const texts: Record<Locale, readonly string[]> = {
  id: [
    "Pasar",
    "Cari saham",
    "Cari kode atau nama, misalnya BBRI",
    "Terapkan",
    "Sektor",
    "Urutkan menurut",
    "Urutkan menaik",
    "Semua",
    "Beta",
    "Volatilitas/bln",
    "Kode",
    "1 bulan",
    "Harga",
    "Perubahan",
    "IHSG",
    "Rentang grafik IHSG",
    "1B",
    "3B",
    "1T",
    "Penutupan IHSG pada setiap hari bursa",
    "Hari bursa",
  ],
  en: [
    "Market",
    "Search stocks",
    "Search code or company, such as BBRI",
    "Apply",
    "Sector",
    "Sort by",
    "Sort ascending",
    "All",
    "Beta",
    "Volatility/month",
    "Code",
    "1 month",
    "Price",
    "Change",
    "IHSG",
    "IHSG chart range",
    "1M",
    "3M",
    "1Y",
    "IHSG close on each trading day",
    "Trading day",
  ],
};
const states: Record<
  Locale,
  {
    one: string;
    several: string;
    none: string;
    emptySector: string;
    clear: string;
    noChart: string;
    unavailable: string;
    missed: string;
    noPrice: string;
    time: string;
    oldTime: string;
    reference: string;
    referenceMarks: string;
    descendingLink: string;
    directionField: readonly string[];
    period: string;
  }
> = {
  id: {
    one: "Saham LQ45 · 1",
    several: "Saham LQ45 · 45",
    none: 'Tidak ada saham LQ45 yang cocok dengan "tidakada" dan sektor yang dipilih. Hapus filter untuk melihat semua saham.',
    emptySector:
      "Sektor yang dipilih tidak memiliki saham dalam daftar LQ45 saat ini. Pilih sektor lain atau hapus filter untuk melihat semua saham.",
    clear: "Hapus filter",
    noChart:
      "Belum ada harga penutupan dalam rentang ini. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan dalam rentang ini.",
    unavailable:
      "Daftar LQ45 yang sah untuk 1 Februari 2027 belum tercatat. Beri tahu orang yang menjalankan server Portolab ini agar daftar dari BEI dapat diperiksa dan ditambahkan.",
    missed: "Pembaruan terakhir gagal",
    noPrice: "Portolab belum memiliki harga WIFI.",
    time: "30 Okt 2026, 16.14 WIB",
    oldTime: "29 Okt 2026",
    period: "60 imbal hasil bulanan, dari Oktober 2021 sampai September 2026.",
    reference:
      "Beta dan volatilitas memakai paling banyak 60 imbal hasil bulanan dari Okt 2021 sampai Sep 2026.",
    referenceMarks: "Garis tegak di tabel: IHSG.",
    descendingLink: "Urutkan menurun",
    directionField: ["Urutan", "Menurun", "Menaik"],
  },
  en: {
    one: "LQ45 stock · 1",
    several: "LQ45 stocks · 45",
    none: 'No LQ45 stocks match "tidakada" and the chosen sector. Clear filters to see all stocks.',
    emptySector:
      "The chosen sector has no stocks in the current LQ45 list. Choose another sector or clear filters to see all stocks.",
    clear: "Clear filters",
    noChart:
      "There are no closing prices in this range yet. Check again when a price history update stores closes in this range.",
    unavailable:
      "A valid LQ45 list for February 1, 2027 has not been recorded. Tell the person who runs this Portolab server so that the list from IDX can be checked and added.",
    missed: "Last update failed",
    noPrice: "Portolab has no price for WIFI yet.",
    time: "Oct 30, 2026, 4:14 PM WIB",
    oldTime: "Oct 29, 2026",
    period: "60 monthly returns, from October 2021 to September 2026.",
    reference:
      "Beta and volatility use at most 60 monthly returns from Oct 2021 to Sep 2026.",
    referenceMarks: "Vertical ticks in the table mark the IHSG.",
    descendingLink: "Sort descending",
    directionField: ["Order", "Descending", "Ascending"],
  },
};

type Props = ComponentProps<typeof MarketView>;
for (const locale of locales) {
  test(`explains empty sectors and only describes reference marks when the table has them in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const props = await marketViewPropsForTest();
    for (const query of ["", "   "]) {
      const emptySector = renderMarketForTest(props, {
        filters: {
          ...defaultMarketFilters,
          query,
          sector: "propertiesAndRealEstate",
        },
      });
      expect(emptySector).toContain(states[locale].emptySector);
      expect(emptySector).toContain(states[locale].clear);
      expect(emptySector).not.toContain(states[locale].referenceMarks);
    }
    for (const query of ["tidakada", "WIFI"]) {
      const withoutMarks = renderMarketForTest(props, {
        filters: { ...defaultMarketFilters, query },
      });
      expect(withoutMarks).not.toContain(states[locale].referenceMarks);
    }
    const context = await marketContextForTest();
    context.get(databaseContext).delete(indexQuotes).run();
    const withoutIndexQuote = readMarket(context, props.now, "3m");
    for (const [market, hasIndexQuote] of [
      [props, true],
      [withoutIndexQuote, false],
    ] as const) {
      expect(market.marketReference.ok).toBe(true);
      expect(market.indexQuote !== undefined).toBe(hasIndexQuote);
      for (const [query, hasMeasures] of [
        ["BBCA", true],
        ["GOTO", false],
      ] as const) {
        const row = market.rows.find((stock) => stock.code === query);
        expect(row).toBeDefined();
        expect(row?.quote).toBeDefined();
        expect(row?.measures !== undefined).toBe(hasMeasures);
        const html = renderMarketForTest(props, {
          ...market,
          filters: { ...defaultMarketFilters, query },
        });
        expect(html).toContain(states[locale].one);
        expect(html.includes(states[locale].referenceMarks)).toBe(
          hasMeasures || hasIndexQuote,
        );
      }
    }
  });
  test(`keeps unavailable and constant market references out of calculation controls in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const context = await marketContextForTest();
    const database = context.get(databaseContext);
    const history = listIndexHistory(database, "IHSG");
    const first = history.closes[0];
    if (first === undefined)
      throw new Error("The recorded index closes are missing.");
    // An index can keep the same close, so the measures must explain an undefined calculation.
    saveDailyHistory(database, {
      ...history,
      closes: history.closes.map((close) => ({ ...close, close: first.close })),
    });
    const fixed = readMarket(
      context,
      new Date("2026-11-14T00:00:00.000Z"),
      "3m",
    );
    expect(fixed.marketReference.ok).toBe(false);
    const card = (kind: "beta" | "risk", reference: Props["marketReference"]) =>
      renderInRouterForTest(
        <MarketMeasureHelp kind={kind} reference={reference} index="IHSG" />,
        conceptLessonDataForTest(),
      );
    for (const kind of ["beta", "risk"] as const)
      expect(card(kind, fixed.marketReference)).not.toContain("<details>");
    database.delete(indexDailyCloses).run();
    const missing = readMarket(context, fixed.now, "3m");
    expect(missing.marketReference.ok).toBe(false);
    for (const kind of ["beta", "risk"] as const) {
      expect(card(kind, missing.marketReference)).not.toContain("<details>");
    }
  });
  test(`shows the market form, index chart, quotes, missing prices, and explanations in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const props = await marketViewPropsForTest();
    const html = renderMarketForTest(props);
    for (const text of [
      ...texts[locale],
      states[locale].several,
      states[locale].noPrice,
      states[locale].time,
      states[locale].oldTime,
      states[locale].period,
    ])
      expect(html).toContain(text);
    expect(html).toContain('method="get"');
    expect(html).toContain("L100 100L0 100Z");
    expect(html).toContain("/classes/1/stocks/BBCA");
    expect(html).not.toContain('role="slider"');
    expect(html).toContain(states[locale].reference);
    expect(html).toContain(states[locale].referenceMarks);
    const one = renderMarketForTest(props, {
      filters: { ...defaultMarketFilters, query: "BBCA" },
    });
    expect(one).toContain(states[locale].one);
    const ascending = renderMarketForTest(props, {
      filters: { ...defaultMarketFilters, direction: "ascending" },
    });
    expect(ascending).toContain(states[locale].descendingLink);
    expect(ascending).toContain("direction=descending");
    // A direction that the address refused takes its field back, with its label and both choices, so its error names a field that the reader sees.
    const refused = renderMarketForTest(props, {
      values: { ...defaultMarketFilters, direction: "salah" },
      failures: { ...props.failures, direction: "refused" },
    });
    for (const text of states[locale].directionField)
      expect(refused).toContain(`>${text}<`);
    const withoutIndexHistory = await marketContextForTest();
    withoutIndexHistory.get(databaseContext).delete(indexDailyCloses).run();
    const empty = renderMarketForTest(props, {
      ...readMarket(withoutIndexHistory, props.now, "1y"),
      filters: { ...defaultMarketFilters, query: "tidakada", range: "1y" },
    });
    for (const text of [
      states[locale].none,
      states[locale].clear,
      states[locale].noChart,
    ])
      expect(empty).toContain(text);
    const uncovered = renderMarketForTest(
      props,
      readMarket(
        await marketContextForTest(),
        new Date("2027-02-01T00:00:00.000Z"),
        "3m",
      ),
    );
    expect(uncovered).toContain(states[locale].unavailable);
    expect(uncovered).not.toContain(states[locale].none);
    const missed = renderMarketForTest(props, {
      latestAttempt: {
        attemptedAt: new Date("2026-11-14T00:00:00.000Z"),
        succeeded: true,
        consecutiveFailures: 0,
        failedCodes: ["IHSG", "BBCA", "WIFI"],
      },
    });
    expect(missed.match(new RegExp(states[locale].missed, "g"))).toHaveLength(
      4,
    );
  });
}
