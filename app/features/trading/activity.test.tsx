import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { ActivityOrders } from "./activity-orders";
import {
  activityNowForTest,
  activityOrderForTest,
  filledActivityForTest,
  soldActivityForTest,
  rejectedActivityForTest,
} from "./activity-for-test";
import { JournalList } from "./journal-list";
import { tradeJournal } from "./trade-journal";
import type { PricesOfView } from "~/features/market-data/read-prices.server";

const classId = 7 as ClassId;
const reason = "Bank besar.\n\nBeta rendah.";
const orders = [
  activityOrderForTest(1, { reason }),
  activityOrderForTest(2, {
    price: { kind: "limit", limit: rupiah(4_950) },
    state: { kind: "resting" },
  }),
  filledActivityForTest(3),
  activityOrderForTest(4, {
    state: { kind: "expired", expiredAt: new Date("2026-11-02T09:26:00Z") },
  }),
  activityOrderForTest(5, {
    state: { kind: "cancelled", cancelledAt: activityNowForTest },
  }),
  rejectedActivityForTest(6),
];

const texts: Record<
  Locale,
  {
    labels: readonly string[];
    details: readonly string[];
    journal: readonly string[];
    empty: readonly string[];
    noCost: string;
    noChange: string;
    returns: readonly string[];
    saleLoss: string;
  }
> = {
  id: {
    saleLoss: "Laba atau rugi terealisasi ▼ -Rp\u00a099.735",
    returns: ["-2,11%", "0,00%", "+2,41%"],
    labels: [
      "Order",
      "Saring menurut status",
      "Semua",
      "Menunggu",
      "Terisi",
      "Ditolak",
      "Kedaluwarsa",
      "Dibatalkan",
      "Batalkan order",
      "Buka tiket BBCA",
      "Harga pasar",
    ],
    details: [
      "Limit Rp\u00a04.950",
      "dipasang 2 Nov 2026, 10.00 WIB",
      "Berlaku pada harga sesi mulai 2 Nov 2026, 09.00 WIB sampai kedaluwarsa 2 Nov 2026, 16.26 WIB.",
      "Terisi di Rp\u00a04.980, 2 Nov 2026, 09.50 WIB.",
      "Dibatalkan 2 Nov 2026, 10.00 WIB.",
      "Kedaluwarsa 2 Nov 2026, 16.26 WIB tanpa tereksekusi.",
      "Ditolak 2 Nov 2026, 10.01 WIB, pada harga tertunda yang tercatat 2 Nov 2026, 09.51 WIB. ",
      `“${reason}”`,
    ],
    journal: [
      "Jurnal transaksi",
      "1 transaksi",
      "2 transaksi",
      "Tanpa alasan.",
      "Sejak dibeli",
      "Harga sejak dijual",
      "Laba atau rugi terealisasi",
      "2 Nov 2026, 10.00 WIB",
    ],
    empty: [
      "Belum ada order. Order pertama muncul di sini setelah Anda memasang order saham.",
      "Tidak ada order dengan status ini.",
      "Transaksi yang terisi muncul di sini bersama alasannya.",
    ],
    noCost: "Tidak dapat dihitung karena riwayat pembelian tidak lengkap.",
    noChange:
      "Perubahan sejak transaksi belum tersedia karena belum ada harga BBCA yang tercatat pada atau setelah transaksi.",
  },
  en: {
    saleLoss: "Realised profit or loss ▼ -IDR\u00a099,735",
    returns: ["-2.11%", "0.00%", "+2.41%"],
    labels: [
      "Orders",
      "Filter by status",
      "All",
      "Waiting",
      "Filled",
      "Rejected",
      "Expired",
      "Cancelled",
      "Cancel order",
      "Open ticket for BBCA",
      "Market price",
    ],
    details: [
      "Limit IDR\u00a04,950",
      "placed Nov 2, 2026, 10:00 AM WIB",
      "Valid at session prices from Nov 2, 2026, 9:00 AM WIB until expiry at Nov 2, 2026, 4:26 PM WIB.",
      "Filled at IDR\u00a04,980, Nov 2, 2026, 9:50 AM WIB.",
      "Cancelled Nov 2, 2026, 10:00 AM WIB.",
      "Expired Nov 2, 2026, 4:26 PM WIB without filling.",
      "Rejected Nov 2, 2026, 10:01 AM WIB, at a delayed price quoted Nov 2, 2026, 9:51 AM WIB. ",
      `“${reason}”`,
    ],
    journal: [
      "Trade journal",
      "1 trade",
      "2 trades",
      "No reason.",
      "Since purchase",
      "Price since sale",
      "Realised profit or loss",
      "Nov 2, 2026, 10:00 AM WIB",
    ],
    empty: [
      "No orders yet. Your first stock order appears here once you place it.",
      "No orders have this status.",
      "Filled trades appear here with their reasons.",
    ],
    noCost: "Unavailable because the purchase history is incomplete.",
    noChange:
      "The change since the trade is unavailable because no price of BBCA is quoted at or after the trade.",
  },
};

function prices(): PricesOfView {
  return {
    quotes: [],
    latestAttempt: undefined,
    now: activityNowForTest,
    source: fixturePriceSource,
  };
}

for (const locale of locales) {
  test(`names realised losses and keeps the sale's negative amount in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // Python Decimal gives 500 × 4,800 - 3,600 - 2,400 = 2,394,000 in net proceeds, and 2,394,000 - 2,493,735 = -99,735 against the purchase cost.
    const sale = soldActivityForTest(2, {
      price: rupiah(4_800),
      value: rupiah(2_400_000),
      fee: rupiah(3_600),
      tax: rupiah(2_400),
      cashChange: rupiah(2_394_000),
    });
    const markup = renderMarkupForTest(
      <JournalList
        trades={tradeJournal([filledActivityForTest(1), sale], [])}
        prices={prices()}
        classId={classId}
      />,
    );
    expect(markup.replace(/<[^>]+>/g, "")).toContain(
      markupTextForTest(texts[locale].saleLoss),
    );
  });
  test(`shows a loss, zero change, and a gain from independently computed price returns in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // Python Decimal gives 4,875 / 4,980 - 1 = -0.02108433735, zero at 4,980, and 5,100 / 4,980 - 1 = 0.02409638554.
    for (const index of [0, 1, 2] as const) {
      const price = ([4_875, 4_980, 5_100] as const)[index];
      const quote = stockQuote("BBCA", [price, 4_980], "2026-11-02T03:00:00Z");
      const markup = renderMarkupForTest(
        <JournalList
          trades={tradeJournal([filledActivityForTest(1)], [quote])}
          prices={prices()}
          classId={classId}
        />,
      );
      expect(markup).toContain(texts[locale].returns[index]);
      expect(markup).toContain(
        `data-change="${(["fall", "none", "rise"] as const)[index]}"`,
      );
    }
  });
  test(`shows every order state with its numbers and reason and filters the five chips in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const markup = renderMarkupForTest(
      <ActivityOrders
        orders={orders}
        now={activityNowForTest}
        classId={classId}
        filter="all"
      />,
    );
    for (const text of texts[locale].labels)
      expect(markup).toContain(markupTextForTest(text));
    const content = markup.replace(/<[^>]+>/g, "");
    for (const text of texts[locale].details)
      expect(content).toContain(markupTextForTest(text));
    expect(markup.match(/name="cancel"/g)).toHaveLength(2);
    const waiting = renderMarkupForTest(
      <ActivityOrders
        orders={orders}
        now={activityNowForTest}
        classId={classId}
        filter="waiting"
      />,
    );
    expect(waiting.match(/name="cancel"/g)).toHaveLength(2);
    expect(waiting).not.toContain(texts[locale].details[3]);
  });

  test(`shows filled trades with and without reasons, signed returns, sale gains, and each empty state in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const purchase = filledActivityForTest(1, { reason });
    const sale = soldActivityForTest(2);
    const quote = stockQuote("BBCA", [5_100, 4_980], "2026-11-02T03:00:00Z");
    const markup = [
      renderMarkupForTest(
        <JournalList
          trades={tradeJournal([purchase, sale], [quote])}
          prices={prices()}
          classId={classId}
        />,
      ),
      renderMarkupForTest(
        <JournalList
          trades={tradeJournal([purchase], [quote])}
          prices={prices()}
          classId={classId}
        />,
      ),
    ].join("");
    for (const text of texts[locale].journal)
      expect(markup.replace(/<[^>]+>/g, "")).toContain(markupTextForTest(text));
    expect(markup).toContain(reason);
    for (const order of [purchase, sale]) {
      const missing = renderMarkupForTest(
        <JournalList
          trades={tradeJournal([order], [])}
          prices={prices()}
          classId={classId}
        />,
      );
      expect(missing).toContain(texts[locale].noChange);
      if (order.side === "sell")
        expect(missing).toContain(texts[locale].noCost);
    }
    const empty = [
      renderMarkupForTest(
        <ActivityOrders
          orders={[]}
          now={activityNowForTest}
          classId={classId}
          filter="all"
        />,
      ),
      renderMarkupForTest(
        <ActivityOrders
          orders={[purchase]}
          now={activityNowForTest}
          classId={classId}
          filter="waiting"
        />,
      ),
      renderMarkupForTest(
        <JournalList trades={[]} prices={prices()} classId={classId} />,
      ),
    ].join("");
    for (const text of texts[locale].empty) expect(empty).toContain(text);
  });
}
