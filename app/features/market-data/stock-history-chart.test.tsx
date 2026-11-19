import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { StockHistoryChart } from "./stock-history-chart";

for (const locale of locales) {
  test(`colors the selected stock range by its direction without a caption or single-line legend in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const history = monthEndClosesForTest("BBCA");
    if (history.kind !== "stock") throw new Error("BBCA has stock closes.");
    for (const [first, last, direction] of [
      ["2021-08-31", "2021-09-30", "rise"],
      ["2021-10-29", "2021-11-30", "fall"],
      ["2023-02-28", "2023-03-31", "none"],
    ] as const) {
      const closes = history.closes.filter(
        (point) => point.date >= first && point.date <= last,
      );
      expect(closes).toHaveLength(2);
      const html = renderInRouterForTest(
        <StockHistoryChart
          history={{ ...history, closes }}
          range="1m"
          path="/classes/7/stocks/BBCA"
          returnTo={undefined}
        />,
      );
      expect(html).toContain(`data-line="${direction}"`);
      expect(html).not.toContain("<ul");
      expect(html).not.toContain("<p>");
    }
  });
}

const heads: Record<
  Locale,
  {
    title: string;
    rangeLabel: string;
    ranges: readonly string[];
    table: string;
    noCloses: string;
  }
> = {
  id: {
    title: "Harga penutupan BBCA",
    rangeLabel: "Rentang grafik harga",
    table: "Tabel harga penutupan",
    ranges: ["1 bln", "3 bln", "1 thn", "5 thn"],
    noCloses:
      "Belum ada harga penutupan dalam rentang ini. Periksa kembali setelah pembaruan riwayat harga menyimpan penutupan dalam rentang ini.",
  },
  en: {
    title: "BBCA closing prices",
    rangeLabel: "Price chart range",
    table: "Table of closing prices",
    ranges: ["1 mo", "3 mo", "1 yr", "5 yr"],
    noCloses:
      "There are no closing prices in this range yet. Check again when a price history update stores closes in this range.",
  },
};

for (const locale of locales) {
  test(`titles the chart in its first row beside the choice of its range, and keeps that choice in a range without closes, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const history = monthEndClosesForTest("BBCA");
    if (history.kind !== "stock") throw new Error("BBCA has stock closes.");
    const head = heads[locale];
    for (const closes of [history.closes, []]) {
      const html = renderInRouterForTest(
        <StockHistoryChart
          history={{ ...history, closes }}
          range="1y"
          path="/classes/7/stocks/BBCA"
          returnTo={undefined}
        />,
      );
      const links = [...html.matchAll(/<a\b[^>]*>([^<]*)<\/a>/gu)];
      expect(links.map(([, label]) => label)).toEqual(head.ranges);
      expect(
        links.filter(([link]) => link.includes('aria-current="true"')),
      ).toEqual([expect.arrayContaining([head.ranges[2]])]);
      expect(html).toMatch(
        new RegExp(
          `^<div[^>]*><h2 id="price-chart-title"[^>]*>${head.title}</h2><nav`,
          "u",
        ),
      );
      expect(html).toContain(`aria-label="${head.rangeLabel}"><a`);
      expect(html.includes(head.noCloses)).toBe(closes.length === 0);
      expect(html.includes(`<summary>${head.table}</summary>`)).toBe(
        closes.length > 0,
      );
    }
  });
}
