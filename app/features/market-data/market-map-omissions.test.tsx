import { inArray } from "drizzle-orm";
import { expect, test } from "vitest";
import { databaseContext } from "~/database/database.server";
import {
  createReadyTestLecturer,
  readerContextForTest,
} from "~/features/accounts/accounts-for-test.server";
import { createClass } from "~/features/classes/class-store.server";
import { rupiah } from "~/units/rupiah";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { languageNames } from "~/language-names";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { marketContextForTest } from "./market-context-for-test.server";
import {
  marketViewPropsForTest,
  renderMarketForTest,
} from "./market-view-for-test";
import { defaultMarketFilters } from "./market-filters";
import { priceSourceContext } from "./price-source-context.server";
import { stockQuotes } from "./market-data.schema";
import { readMarketMap } from "./read-market-map.server";

const texts: Record<Locale, { codes: string; requirement: string }> = {
  id: {
    codes: "BBCA dan TLKM",
    requirement:
      "Peta memerlukan harga tertunda setelah penutupan pada atau sebelum 14 Oktober 2026. Periksa kembali setelah pembaruan harga dan riwayat menyimpan keduanya.",
  },
  en: {
    codes: "BBCA and TLKM",
    requirement:
      "The map needs a delayed price after a close on or before October 14, 2026. Check again when price and history updates store both.",
  },
};

for (const locale of locales)
  test(`groups measured stocks whose quotes were deleted under one explanation in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const market = await marketContextForTest();
    const database = market.get(databaseContext);
    database
      .delete(stockQuotes)
      .where(inArray(stockQuotes.code, ["BBCA", "TLKM"]))
      .run();
    const props = await marketViewPropsForTest(market);
    const now = props.now;
    const lecturerId = await createReadyTestLecturer(
      database,
      "map-lecturer",
      "Map lecturer",
    );
    const classId = createClass(
      database,
      {
        lecturerId,
        name: "Map class",
        startingCash: rupiah(100_000_000),
        firstSessionDate: "2026-10-01",
      },
      now,
    );
    const context = readerContextForTest(database, { userId: lecturerId, now });
    context.set(priceSourceContext, market.get(priceSourceContext));
    const missing = props.rows.filter((row) =>
      ["BBCA", "TLKM"].includes(row.code),
    );
    expect(missing).toHaveLength(2);
    expect(
      missing.every(
        (row) => row.measures !== undefined && row.quote === undefined,
      ),
    ).toBe(true);
    const url = new URL(
      `http://localhost/classes/${String(classId)}/market?view=map`,
    );
    const map = readMarketMap(
      context,
      { request: new Request(url), url, classId: String(classId), now },
      "1m",
    );
    const filters = { ...defaultMarketFilters, view: "map" as const };
    const html = renderMarketForTest(props, {
      classId,
      map,
      filters,
      values: filters,
    });
    expect(html).toContain(`<dt>${texts[locale].codes}</dt>`);
    expect(html.split(texts[locale].requirement)).toHaveLength(2);
  });
