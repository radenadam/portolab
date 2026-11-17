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
      // Python Decimal gives 5 × 100 × 5,025 = 2,512,500, a fee of 0.15% of it rounded half up to 3,769, and 2,516,269 in all.
      "Ditolak 2 Nov 2026, 10.01 WIB. Harga naik dari Rp 4.980 ke Rp 5.025, jadi 5 lot BBCA butuh Rp 2.516.269 termasuk biaya, sedangkan kas yang tersedia Rp 2.500.000.",
      "Mengapa order ini ditolak",
      "Portolab memeriksa order ini pada harga tertunda yang tercatat 2 Nov 2026, 09.51 WIB.",
      "Jumlah Rp 2.516.269 itu terdiri dari Rp 2.512.500 untuk saham dan Rp 3.769 untuk biaya broker. Pasang order baru jika Anda masih menginginkan BBCA, dan Portolab memeriksanya pada harga dan kas saat itu.",
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
      "Rejected Nov 2, 2026, 10:01 AM WIB. The price rose from IDR 4,980 to IDR 5,025, so 5 lots of BBCA needed IDR 2,516,269 with fees, but the available cash was IDR 2,500,000.",
      "Why this order was rejected",
      "Portolab checked this order at a delayed price quoted Nov 2, 2026, 9:51 AM WIB.",
      "The IDR 2,516,269 is IDR 2,512,500 for the shares and IDR 3,769 for the broker fee. Place a new order if you still want BBCA, and Portolab checks it at the price and with the cash of that moment.",
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
  test(`keeps every order visible to the lecturer without cancellation or retry controls in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const owner = renderMarkupForTest(
      <ActivityOrders
        orders={orders}
        now={activityNowForTest}
        classId={classId}
        filter="all"
      />,
    );
    const actions = texts[locale].labels.slice(8, 10);
    expect(actions).toHaveLength(2);
    for (const action of actions)
      expect(owner).toContain(markupTextForTest(action));
    const lecturer = renderMarkupForTest(
      <ActivityOrders
        orders={orders}
        now={activityNowForTest}
        classId={classId}
        filter="all"
        readOnly
        studentName="Raka"
        basePath="/classes/7/students/9/journal?returnTo=selected"
      />,
    );
    expect(lecturer).not.toContain('method="post"');
    expect(lecturer).toContain("<q>");
    expect(owner).not.toContain("<q>");
    for (const label of actions)
      expect(lecturer).not.toContain(markupTextForTest(label));
    for (const detail of texts[locale].details)
      expect(lecturer.replace(/<[^>]+>/g, "")).toContain(
        markupTextForTest(detail),
      );
    expect(lecturer).toContain(
      "/classes/7/students/9/journal?returnTo=selected&amp;status=filled",
    );
  });
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
        readOnly={false}
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
          readOnly={false}
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
          readOnly={false}
          trades={tradeJournal([purchase, sale], [quote])}
          prices={prices()}
          classId={classId}
        />,
      ),
      renderMarkupForTest(
        <JournalList
          readOnly={false}
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
          readOnly={false}
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
        <JournalList
          readOnly={false}
          trades={[]}
          prices={prices()}
          classId={classId}
        />,
      ),
    ].join("");
    for (const text of texts[locale].empty) expect(empty).toContain(text);
  });
}

const journalTimes: Record<
  Locale,
  {
    shared: string;
    sameDay: string;
    otherDay: string;
    note: string;
    apart: string;
  }
> = {
  id: {
    shared: "Harga 2 Nov 2026, 10.00 WIB.",
    sameDay: "09.55 WIB",
    otherDay: "30 Okt 2026, 16.00 WIB",
    note: "Harga ",
    apart: "Harga 2 Nov 2026, 09.55 WIB.",
  },
  en: {
    shared: "Prices Nov 2, 2026, 10:00 AM WIB.",
    sameDay: "9:55 AM WIB",
    otherDay: "Oct 30, 2026, 4:00 PM WIB",
    note: "Prices ",
    apart: "Prices Nov 2, 2026, 9:55 AM WIB.",
  },
};

for (const locale of locales) {
  test(`states the time that the compared prices of the journal share once and keeps every other time beside its price, with the date only for another day, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // A failed update can leave the quote of BMRI from an earlier day while the others are current.
    const trades = [
      filledActivityForTest(11, { code: "BBCA" }),
      filledActivityForTest(12, { code: "TLKM" }),
      filledActivityForTest(13, { code: "ASII" }),
      filledActivityForTest(14, {
        code: "BMRI",
        state: {
          kind: "filled",
          fill: {
            price: rupiah(4_980),
            value: rupiah(2_490_000),
            fee: rupiah(3_735),
            tax: rupiah(0),
            cashChange: rupiah(-2_493_735),
            quotedAt: new Date("2026-10-30T02:50:00Z"),
            filledAt: new Date("2026-10-30T03:00:00Z"),
          },
        },
      }),
    ];
    const quotes = [
      stockQuote("BBCA", [5_000, 4_980], "2026-11-02T03:00:00Z"),
      stockQuote("TLKM", [5_000, 4_980], "2026-11-02T03:00:00Z"),
      stockQuote("ASII", [5_000, 4_980], "2026-11-02T02:55:00Z"),
      stockQuote("BMRI", [5_000, 4_980], "2026-10-30T09:00:00Z"),
    ];
    const shared = renderMarkupForTest(
      <JournalList
        readOnly={false}
        trades={tradeJournal(trades, quotes)}
        prices={prices()}
        classId={classId}
      />,
    ).replace(/<[^>]+>/g, "");
    const times = journalTimes[locale];
    expect(
      shared.split(times.shared.slice(times.note.length, -1)),
    ).toHaveLength(2);
    for (const text of [times.shared, times.sameDay, times.otherDay])
      expect(shared).toContain(markupTextForTest(text));
    const apart = renderMarkupForTest(
      <JournalList
        readOnly={false}
        trades={tradeJournal(trades.slice(2), quotes.slice(2))}
        prices={prices()}
        classId={classId}
      />,
    ).replace(/<[^>]+>/g, "");
    // Two prices of different times share no minute, so the latest of them is stated once and the other keeps its own time.
    expect(apart.split(times.note)).toHaveLength(2);
    for (const text of [times.apart, times.otherDay])
      expect(apart).toContain(markupTextForTest(text));
    // A price quoted before a trade gives that entry no comparison, so it shows no time either.
    const earlier = renderMarkupForTest(
      <JournalList
        readOnly={false}
        trades={tradeJournal(trades.slice(0, 2), [
          stockQuote("BBCA", [5_000, 4_980], "2026-11-02T02:40:00Z"),
          stockQuote("TLKM", [5_000, 4_980], "2026-11-02T02:40:00Z"),
        ])}
        prices={prices()}
        classId={classId}
      />,
    ).replace(/<[^>]+>/g, "");
    expect(earlier).not.toContain(times.note);
  });
}
