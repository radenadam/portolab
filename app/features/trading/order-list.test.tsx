import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { lots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { parseRecordId } from "~/value-parsers";
import type { OpenOrder, Order, OrderRequest, OrderState } from "./order";
import { OpenOrderList, PastOrderList, ReasonSection } from "./order-list";
import {
  acceptedForTest,
  accountForTest,
  bbcaForTest,
  duringSessionForTest,
  endOfMondayForTest,
  limitForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import type { OrderId } from "./trading.schema";

// The orders of Monday 2 November 2026, placed at 10:00 WIB while the latest quote of BBCA was Rp4,980. The account holds the 500 shares that the sales sell. The amounts of the fills are those of check-order.test.ts, and the cost at Rp5,025 was computed with the decimal module of Python, with a broker fee of 0.15% rounded to a whole rupiah with ROUND_HALF_UP. Intl puts a no-break space after the currency, which the texts write as \u00a0.
const account = accountForTest({
  holdings: [{ code: "BBCA", shares: shares(500), cost: rupiah(2_493_735) }],
});
const quotedAt = new Date("2026-11-02T02:50:00Z");

function accepted(request: OrderRequest): OpenOrder {
  return acceptedForTest(request, account, bbcaForTest);
}

function listed(order: Order, number: number): Order & { id: OrderId } {
  return {
    ...order,
    id: successValueForTest(
      parseRecordId<OrderId>(String(number), "id"),
      "The number is an id",
    ),
  };
}

function withState(order: Order, state: OrderState): Order {
  return { ...order, state };
}

const marketPurchase = accepted(purchaseForTest());
const marketSale = accepted(saleForTest());
const limitPurchase = accepted(
  purchaseForTest({ lots: orderLotsForTest(1), price: limitForTest(4_950) }),
);
const limitSale = accepted(
  saleForTest({ lots: orderLotsForTest(1), price: limitForTest(5_050) }),
);

const openOrders = [
  listed(marketPurchase, 1),
  listed(withState(limitSale, { kind: "resting" }), 2),
  listed(limitPurchase, 3),
  listed(marketSale, 4),
];

const pastOrders = [
  listed(
    withState(marketPurchase, {
      kind: "filled",
      fill: {
        price: rupiah(4_980),
        value: rupiah(2_490_000),
        fee: rupiah(3_735),
        tax: rupiah(0),
        cashChange: rupiah(-2_493_735),
        quotedAt,
        filledAt: duringSessionForTest,
      },
    }),
    1,
  ),
  listed(
    withState(marketSale, {
      kind: "filled",
      fill: {
        price: rupiah(4_980),
        value: rupiah(2_490_000),
        fee: rupiah(3_735),
        tax: rupiah(2_490),
        cashChange: rupiah(2_483_775),
        quotedAt,
        filledAt: duringSessionForTest,
      },
    }),
    2,
  ),
  listed(
    withState(limitPurchase, {
      kind: "expired",
      expiredAt: new Date("2026-11-02T09:30:00Z"),
    }),
    3,
  ),
  listed(
    withState(marketPurchase, {
      kind: "rejected",
      rejectedAt: new Date("2026-11-02T03:01:00Z"),
      quotedAt: new Date("2026-11-02T02:51:00Z"),
      failure: {
        kind: "priceRose",
        code: "BBCA",
        lots: lots(5),
        checkedPrice: rupiah(4_980),
        price: rupiah(5_025),
        value: rupiah(2_512_500),
        fee: rupiah(3_769),
        tax: rupiah(0),
        availableCash: rupiah(2_500_000),
      },
    }),
    4,
  ),
  listed(
    withState(marketSale, {
      kind: "rejected",
      rejectedAt: new Date("2026-11-02T03:01:00Z"),
      quotedAt: new Date("2026-11-02T02:51:00Z"),
      failure: {
        kind: "sharesGone",
        code: "BBCA",
        lots: lots(5),
        heldLots: lots(2),
        setAside: { amount: lots(0), orders: 0 },
      },
    }),
    5,
  ),
  listed(
    withState(limitSale, {
      kind: "cancelled",
      cancelledAt: new Date("2026-11-02T03:30:00Z"),
    }),
    6,
  ),
];

// A reason of two paragraphs, as the order form reads it with its line break.
const reason = "Bank besar dengan laba stabil.\n\nBeta di bawah 1.";
const studentName = "Siti Rahayu";

/** The orders of a student of whom the second and the third have a reason, placed in that order. */
const ordersWithReasons = [
  listed(marketPurchase, 1),
  listed({ ...limitPurchase, reason }, 2),
  listed(
    withState(
      { ...marketSale, reason: "Mengunci sebagian laba." },
      { kind: "cancelled", cancelledAt: new Date("2026-11-02T03:30:00Z") },
    ),
    3,
  ),
];

/** The markup of a list without the names of the classes of CSS modules, which carry a hash. */
function withoutClasses(html: string): string {
  return html.replaceAll(/ class="[^"]*"/g, "");
}

const texts: Record<
  Locale,
  {
    noOpenOrders: string;
    noPastOrders: string;
    cancel: string;
    open: readonly string[];
    past: readonly string[];
    expiredAtEnd: readonly string[];
    reasonLabel: string;
    reasons: { title: string; noReasons: string; items: readonly string[] };
  }
> = {
  id: {
    noOpenOrders: "Anda tidak memiliki order yang masih terbuka.",
    noPastOrders: "Belum ada order Anda yang berakhir.",
    cancel: "Batalkan order ini",
    open: [
      "Beli 5 lot BBCA pada harga pasar",
      "Dipasang pada 2 Nov 2026, 10.00 WIB untuk hari bursa 2 November 2026.",
      "Order ini menunggu harga tertunda BBCA dari sesi I atau sesi II.",
      "Order ini menyisihkan Rp\u00a02.493.735 dari kas Anda.",
      "Order ini kedaluwarsa pada pukul 16.26 WIB jika belum tereksekusi.",
      "Jual 1 lot BBCA dengan limit Rp\u00a05.050",
      "Order ini menunggu di harga limitnya, karena harga tertunda pada sesinya belum mencapai limit tersebut. Order ini tereksekusi pada harga limitnya begitu sebuah harga mencapainya.",
      "Order ini menyisihkan 100 saham BBCA.",
      "Beli 1 lot BBCA dengan limit Rp\u00a04.950",
      "Order ini menyisihkan Rp\u00a0495.743 dari kas Anda.",
      "Jual 5 lot BBCA pada harga pasar",
      "Order ini menyisihkan 500 saham BBCA.",
    ],
    past: [
      "Tereksekusi pada Rp\u00a04.980, harga tertunda yang tercatat pada 2 Nov 2026, 09.50 WIB. Biayanya Rp\u00a02.493.735, yaitu Rp\u00a02.490.000 untuk saham dan Rp\u00a03.735 untuk biaya broker.",
      "Tereksekusi pada Rp\u00a04.980, harga tertunda yang tercatat pada 2 Nov 2026, 09.50 WIB. Order ini membawa Rp\u00a02.483.775, yaitu Rp\u00a02.490.000 untuk saham dikurangi Rp\u00a03.735 untuk biaya broker dan Rp\u00a02.490 untuk pajak final atas penjualan.",
      "Order ini kedaluwarsa tanpa tereksekusi saat harga tertunda tanggal 2 November 2026 menjadi final pada pukul 16.26 WIB.",
      "Ditolak pada 2 Nov 2026, 10.01 WIB, pada harga tertunda yang tercatat pada 2 Nov 2026, 09.51 WIB.",
      "Portolab tidak mengeksekusi order harga pasar Anda untuk membeli 5 lot BBCA, karena harganya naik dari Rp\u00a04.980 menjadi Rp\u00a05.025 selama order menunggu. Pada harga Rp\u00a05.025, order tersebut membutuhkan Rp\u00a02.516.269, yaitu Rp\u00a02.512.500 untuk saham dan Rp\u00a03.769 untuk biaya broker, sedangkan kas Anda yang tersedia hanya Rp\u00a02.500.000. Pasang order baru jika Anda masih menginginkan BBCA, dan Portolab memeriksanya pada harga dan kas saat itu.",
      "Portolab tidak mengeksekusi order Anda untuk menjual 5 lot BBCA, karena saat sebuah harga mencapainya, Anda memegang 2 lot BBCA.",
      "Periksa saham yang Anda pegang sekarang di daftar saham Anda di atas sebelum menjual lagi.",
      "Anda membatalkannya pada 2 Nov 2026, 10.30 WIB.",
    ],
    expiredAtEnd: [
      "Beli 5 lot BBCA pada harga pasar",
      "Order ini kedaluwarsa tanpa tereksekusi saat harga tertunda tanggal 2 November 2026 menjadi final pada pukul 16.26 WIB.",
    ],
    reasonLabel: "Alasan Anda: ",
    reasons: {
      title: "Alasan order",
      noReasons: "Siti Rahayu belum menulis alasan untuk order mana pun.",
      items: [
        "<li><p>Jual 5 lot BBCA pada harga pasar</p><p>Dipasang pada 2 Nov 2026, 10.00 WIB untuk hari bursa 2 November 2026.</p><p>Mengunci sebagian laba.</p></li>",
        `<li><p>Beli 1 lot BBCA dengan limit Rp\u00a04.950</p><p>Dipasang pada 2 Nov 2026, 10.00 WIB untuk hari bursa 2 November 2026.</p><p>${reason}</p></li>`,
      ],
    },
  },
  en: {
    noOpenOrders: "You have no open order.",
    noPastOrders: "None of your orders has ended yet.",
    cancel: "Cancel this order",
    open: [
      "Buy 5 lots of BBCA at the market price",
      "Placed on Nov 2, 2026, 10:00 AM WIB for the trading day November 2, 2026.",
      "It waits for a delayed price of BBCA from session I or session II.",
      "It sets aside IDR\u00a02,493,735 of your cash.",
      "It expires at 4:26 PM WIB if it has not filled by then.",
      "Sell 1 lot of BBCA at a limit of IDR\u00a05,050",
      "It rests at its limit, because the delayed prices of its sessions have not reached the limit yet. It fills at its limit once a price reaches it.",
      "It sets aside 100 shares of BBCA.",
      "Buy 1 lot of BBCA at a limit of IDR\u00a04,950",
      "It sets aside IDR\u00a0495,743 of your cash.",
      "Sell 5 lots of BBCA at the market price",
      "It sets aside 500 shares of BBCA.",
    ],
    past: [
      "Filled at IDR\u00a04,980, a delayed price quoted on Nov 2, 2026, 9:50 AM WIB. It cost IDR\u00a02,493,735, which is IDR\u00a02,490,000 for the shares and IDR\u00a03,735 for the broker fee.",
      "Filled at IDR\u00a04,980, a delayed price quoted on Nov 2, 2026, 9:50 AM WIB. It brought IDR\u00a02,483,775, which is IDR\u00a02,490,000 for the shares less IDR\u00a03,735 for the broker fee and IDR\u00a02,490 for the final tax on sales.",
      "It expired without filling when the delayed prices of November 2, 2026 became final at 4:26 PM WIB.",
      "Rejected on Nov 2, 2026, 10:01 AM WIB, at a delayed price quoted on Nov 2, 2026, 9:51 AM WIB.",
      "Portolab did not fill your market order to buy 5 lots of BBCA, because the price rose from IDR\u00a04,980 to IDR\u00a05,025 while the order waited. At IDR\u00a05,025 the order costs IDR\u00a02,516,269, which is IDR\u00a02,512,500 for the shares and IDR\u00a03,769 for the broker fee, but your available cash was IDR\u00a02,500,000. Place a new order if you still want BBCA, and Portolab checks it at the price and with the cash of that moment.",
      "Portolab did not fill your order to sell 5 lots of BBCA, because when a price reached it, you held 2 lots of BBCA.",
      "Check the shares that you hold now in your holdings above before you sell again.",
      "You cancelled it on Nov 2, 2026, 10:30 AM WIB.",
    ],
    expiredAtEnd: [
      "Buy 5 lots of BBCA at the market price",
      "It expired without filling when the delayed prices of November 2, 2026 became final at 4:26 PM WIB.",
    ],
    reasonLabel: "Your reason: ",
    reasons: {
      title: "Reasons for the orders",
      noReasons: "Siti Rahayu has not written a reason for any order yet.",
      items: [
        "<li><p>Sell 5 lots of BBCA at the market price</p><p>Placed on Nov 2, 2026, 10:00 AM WIB for the trading day November 2, 2026.</p><p>Mengunci sebagian laba.</p></li>",
        `<li><p>Buy 1 lot of BBCA at a limit of IDR\u00a04,950</p><p>Placed on Nov 2, 2026, 10:00 AM WIB for the trading day November 2, 2026.</p><p>${reason}</p></li>`,
      ],
    },
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const language = languageNames[locale];

  test(`lists each open order with its price, its state, what it sets aside, its expiry, and a button that cancels it, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderInRouterForTest(
      <OpenOrderList orders={openOrders} now={duringSessionForTest} />,
    );
    for (const sentence of text.open) {
      expect(html).toContain(sentence);
    }
    expect(html.split(`>${text.cancel}</button>`)).toHaveLength(
      openOrders.length + 1,
    );
    expect(html).toContain('name="cancel" value="1"');
  });

  test(`lists each ended order with how it ended, and no button that cancels it, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = renderInRouterForTest(
      <PastOrderList orders={pastOrders} now={duringSessionForTest} />,
    );
    for (const sentence of text.past) {
      expect(html).toContain(sentence);
    }
    expect(html).not.toContain(text.cancel);
  });

  test(`moves an order that a check has not marked expired to the ended orders once the prices of its trading day are final, in ${language}`, () => {
    switchLocaleForTest(locale);
    const orders = [listed(marketPurchase, 1)];
    expect(
      renderInRouterForTest(
        <OpenOrderList orders={orders} now={endOfMondayForTest} />,
      ),
    ).toBe(`<p>${text.noOpenOrders}</p>`);
    const html = renderInRouterForTest(
      <PastOrderList orders={orders} now={endOfMondayForTest} />,
    );
    for (const sentence of text.expiredAtEnd) {
      expect(html).toContain(sentence);
    }
  });

  test(`says when no order is open and when none has ended, in ${language}`, () => {
    switchLocaleForTest(locale);
    expect(
      renderInRouterForTest(
        <OpenOrderList orders={[]} now={duringSessionForTest} />,
      ),
    ).toBe(`<p>${text.noOpenOrders}</p>`);
    expect(
      renderInRouterForTest(
        <PastOrderList orders={[]} now={duringSessionForTest} />,
      ),
    ).toBe(`<p>${text.noPastOrders}</p>`);
  });

  test(`shows the reason that the student wrote, with its paragraphs, under each open and each ended order that has one, in ${language}`, () => {
    switchLocaleForTest(locale);
    const open = withoutClasses(
      renderInRouterForTest(
        <OpenOrderList orders={ordersWithReasons} now={duringSessionForTest} />,
      ),
    );
    expect(open).toContain(`<p>${text.reasonLabel}${reason}</p><form`);
    expect(open.split(text.reasonLabel)).toHaveLength(2);
    const past = withoutClasses(
      renderInRouterForTest(
        <PastOrderList orders={ordersWithReasons} now={duringSessionForTest} />,
      ),
    );
    expect(past).toContain(
      `<p>${text.reasonLabel}Mengunci sebagian laba.</p></li>`,
    );
    expect(
      renderInRouterForTest(
        <OpenOrderList orders={openOrders} now={duringSessionForTest} />,
      ),
    ).not.toContain(text.reasonLabel);
  });

  test(`lists each order of a student that has a reason, newest first, with its price, when it was placed, and the reason, for the lecturer of the class, in ${language}`, () => {
    switchLocaleForTest(locale);
    const { reasons } = text;
    expect(
      withoutClasses(
        renderInRouterForTest(
          <ReasonSection
            orders={ordersWithReasons}
            studentName={studentName}
          />,
        ),
      ),
    ).toBe(
      `<section><h2>${reasons.title}</h2><ul>${reasons.items.join("")}</ul></section>`,
    );
  });

  test(`says that a student has written no reason, whether the student placed no order or orders without a reason, in ${language}`, () => {
    switchLocaleForTest(locale);
    const { reasons } = text;
    for (const orders of [[], openOrders, pastOrders]) {
      expect(
        withoutClasses(
          renderInRouterForTest(
            <ReasonSection orders={orders} studentName={studentName} />,
          ),
        ),
      ).toBe(
        `<section><h2>${reasons.title}</h2><p>${reasons.noReasons}</p></section>`,
      );
    }
  });
}
