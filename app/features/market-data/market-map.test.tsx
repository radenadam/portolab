import { marketMapCorners } from "./market-map-corners";
import { marketMapPoints } from "./market-map-points";
import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { languageNames } from "~/language-names";
import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import { cumulativeReturn } from "~/units/cumulative-return";
import {
  marketViewPropsForTest,
  renderMarketForTest,
} from "./market-view-for-test";
import { defaultMarketFilters } from "./market-filters";

const texts: Record<
  Locale,
  {
    common: readonly string[];
    beta: string;
    risk: string;
    vertical: readonly string[];
    missing: string;
    corners: readonly string[];
  }
> = {
  id: {
    common: [
      "Daftar",
      "Peta",
      "Tampilan pasar",
      "Peta saham LQ45",
      "Sumbu risiko",
      "Rentang perubahan harga",
      "Simpangan baku",
      "Saham Anda",
      "Saham lain",
      "Portofolio Anda",
      "Perubahan harga",
      "Lihat titik pada peta",
      "Belum ada di peta",
      "Mengapa saham belum ada di peta",
      "Perubahan portofolio memakai perubahan harga saham dengan bobot saat ini. Kas tidak berubah. Ini bukan hasil transaksi Anda selama rentang tersebut.",
    ],
    beta: "Beta (1,0 = pasar)",
    risk: "Volatilitas per bulan (simpangan baku)",
    vertical: [
      "Tegak: perubahan harga 1 bulan terakhir.",
      "Tegak: perubahan harga 3 bulan terakhir.",
      "Tegak: perubahan harga 1 tahun terakhir.",
    ],
    missing:
      "Perubahan harga IHSG belum tersedia. Peta memerlukan harga tertunda setelah penutupan pada atau sebelum 14 Oktober 2026. Periksa kembali setelah pembaruan harga dan riwayat menyimpan keduanya.",
    corners: [
      "Tenang, naik",
      "Lebih tenang dari pasar, naik",
      "Bergejolak, naik",
      "Lebih bergejolak, naik",
      "Tenang, turun",
      "Lebih tenang, turun",
      "Bergejolak, turun",
      "Lebih bergejolak, turun",
    ],
  },
  en: {
    common: [
      "List",
      "Map",
      "Market view",
      "LQ45 stock map",
      "Risk axis",
      "Price change range",
      "Standard deviation",
      "Your stocks",
      "Other stocks",
      "Your portfolio",
      "Price change",
      "See the points on the map",
      "Not on the map yet",
      "Why stocks are not on the map yet",
      "The portfolio change uses stock price changes at current weights. Cash does not change. This is not the result of your trades over that range.",
    ],
    beta: "Beta (1.0 = market)",
    risk: "Monthly volatility (standard deviation)",
    vertical: [
      "Vertical: price change over the last 1 month.",
      "Vertical: price change over the last 3 months.",
      "Vertical: price change over the last 1 year.",
    ],
    missing:
      "The price change of IHSG is unavailable. The map needs a delayed price after a close on or before October 14, 2026. Check again when price and history updates store both.",
    corners: [
      "Calmer, rising",
      "Calmer than the market, rising",
      "More volatile, rising",
      "More volatile, rising",
      "Calmer, falling",
      "Calmer, falling",
      "More volatile, falling",
      "More volatile, falling",
    ],
  },
};

for (const locale of locales)
  test(`draws the market map, names missing stocks, and preserves its controls in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    expect(
      marketMapCorners().flatMap((corner) => [corner.text, corner.wideText]),
    ).toEqual(texts[locale].corners);
    const props = await marketViewPropsForTest();
    const map = {
      from: "2026-10-14",
      changes: [
        { code: "BBCA", change: cumulativeReturn(0.1) },
        { code: "TLKM", change: cumulativeReturn(-0.05) },
      ],
      marketChange: cumulativeReturn(0.02),
      heldCodes: ["BBCA"],
      portfolio: {
        beta: beta(0.6),
        standardDeviation: monthlyReturn(0.03),
        change: cumulativeReturn(0.04),
      },
      portfolioFailure: undefined,
    };
    for (const [index, mapRange] of ["1m", "3m", "1y"].entries()) {
      for (const axis of ["beta", "risk"] as const) {
        const filters = {
          ...defaultMarketFilters,
          view: "map" as const,
          mapRange: mapRange as "1m" | "3m" | "1y",
          axis,
        };
        const plotted = marketMapPoints({
          rows: props.rows,
          map,
          reference: props.marketReference,
          filters,
          classId: props.classId,
          task: undefined,
        });
        expect(
          plotted.points.find((item) => item.key === "BBCA")?.mark.kind,
        ).toBe("held");
        expect(
          plotted.points.find((item) => item.key === "TLKM")?.mark.kind,
        ).toBe("other");
        expect(
          plotted.points.find((item) => item.key === "portfolio")?.up,
        ).toBe(0.04);
        const html = renderMarketForTest(props, {
          filters,
          values: filters,
          map,
        });
        for (const text of texts[locale].common) expect(html).toContain(text);
        expect(html).toContain(texts[locale].vertical[index]);
        expect(html).toContain(
          texts[locale][axis === "beta" ? "beta" : "risk"],
        );
        expect(html).toContain("mapRange=");
        expect(html).toContain("/stocks/BBCA?returnTo=");
        expect(html).toContain("GOTO");
        expect(html).not.toContain('id="stocks-heading"');
      }
    }
    const filters = { ...defaultMarketFilters, view: "map" as const };
    const missing = renderMarketForTest(props, {
      filters,
      map: { ...map, marketChange: undefined },
    });
    expect(missing).toContain(texts[locale].missing);
  });
