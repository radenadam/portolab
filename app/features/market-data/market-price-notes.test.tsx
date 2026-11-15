import { expect, test } from "vitest";
import { databaseContext } from "~/database/database.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { defaultMarketFilters } from "./market-filters";
import { marketContextForTest } from "./market-context-for-test.server";
import { stockQuotes, indexQuotes } from "./market-data.schema";
import { readMarket } from "./read-market.server";
import {
  marketViewPropsForTest,
  renderMarketForTest,
} from "./market-view-for-test";

const texts: Record<
  Locale,
  {
    shared: string;
    reason: string;
    heading: string;
    missing: string;
    missingValue: string;
  }
> = {
  id: {
    shared: "Harga 30 Okt 2026, 16.14 WIB.",
    reason: "0 dari 24 imbal hasil bulanan yang dibutuhkan ukuran",
    heading: "Mengapa beta dan volatilitas belum tersedia",
    missing: "Portolab belum memiliki harga WIFI.",
    missingValue: "-",
  },
  en: {
    shared: "Prices Oct 30, 2026, 4:14 PM WIB.",
    reason: "0 of the 24 monthly returns that the measures need",
    heading: "Why beta and volatility are unavailable",
    missing: "Portolab has no price for WIFI yet.",
    missingValue: "-",
  },
};

function stockRow(html: string, code: string): string {
  const row = new RegExp(`<tr[^>]*id="stock-${code}"[^>]*>(.*?)</tr>`).exec(
    html,
  )?.[1];
  if (row === undefined)
    throw new Error(`The market row of ${code} is missing.`);
  return row;
}

for (const locale of locales) {
  test(`states one shared quote time and keeps exceptions beside their prices in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const props = await marketViewPropsForTest();
    const html = renderMarketForTest(props);
    expect(html.split(texts[locale].shared)).toHaveLength(2);
    for (const code of ["BBCA", "TLKM", "GOTO", "UNVR"])
      expect(stockRow(html, code)).not.toContain("<time");
    for (const [code, date] of [
      ["BMRI", "2026-10-29T"],
      ["KLBF", "2026-10-30T09:13:"],
      ["ITMG", "2026-10-30T09:10:"],
    ] as const)
      expect(stockRow(html, code)).toMatch(
        new RegExp(`<time datetime="${date}`, "i"),
      );
    expect(stockRow(html, "WIFI")).toContain(texts[locale].missing);
    expect(stockRow(html, "WIFI")).not.toContain("<time");
    const single = renderMarketForTest(props, {
      filters: { ...defaultMarketFilters, query: "BBCA" },
    });
    expect(single).not.toContain(texts[locale].shared);
    expect(stockRow(single, "BBCA")).toContain("<time");
  });

  test(`keeps missing measures in value cells and explains each reason once below the table in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const props = await marketViewPropsForTest();
    const html = renderMarketForTest(props);
    const row = stockRow(html, "GOTO");
    expect(row.match(/aria-describedby="market-measure-notes"/g)).toHaveLength(
      2,
    );
    expect(row.split(`>${texts[locale].missingValue}</span>`)).toHaveLength(3);
    expect(row).not.toContain(texts[locale].reason);
    expect(html.split(texts[locale].reason)).toHaveLength(2);
    expect(html).toContain(texts[locale].heading);
    const single = renderMarketForTest(props, {
      filters: { ...defaultMarketFilters, query: "BBCA" },
    });
    expect(single).not.toContain(texts[locale].heading);
  });

  test(`omits the shared quote note when the price store has no quotes in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const props = await marketViewPropsForTest();
    const context = await marketContextForTest();
    context.get(databaseContext).delete(stockQuotes).run();
    context.get(databaseContext).delete(indexQuotes).run();
    const market = readMarket(context, props.now, "3m");
    expect(market.quotes).toHaveLength(0);
    const html = renderMarketForTest(props, market);
    expect(html).not.toContain(texts[locale].shared);
    expect(html).not.toContain("<time");
    expect(html).toContain(texts[locale].missing);
  });
}
