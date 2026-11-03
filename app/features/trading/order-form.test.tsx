import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { OrderForm } from "./order-form";
import type { OrderDay } from "./order-form";
import { blankOrderForm } from "./order-form-fields";
import { mondayTradingDayForTest } from "./orders-for-test";

// The trading day of an order placed at 10:00 WIB on Monday 2 November 2026, as orderTradingDay gives it.
const monday: OrderDay = {
  date: mondayTradingDayForTest.date,
  tradesFrom: mondayTradingDayForTest.tradesFrom,
  expiresAt: mondayTradingDayForTest.expiresAt,
  lotShares: mondayTradingDayForTest.rules.lotShares,
  maximumLots: mondayTradingDayForTest.rules.maximumLots,
};

const texts: Record<
  Locale,
  {
    day: string;
    labels: readonly string[];
    hints: readonly string[];
    options: readonly string[];
    placeholder: string;
  }
> = {
  id: {
    day: "Order yang Anda pasang sekarang dapat tereksekusi pada harga tertunda yang tercatat pada sesi I atau sesi II tanggal 2 November 2026, mulai pukul 09.00 WIB, dan kedaluwarsa pada pukul 16.26 WIB jika belum tereksekusi.",
    labels: [
      ">Saham</label>",
      ">Beli atau jual</legend>",
      ">Jenis order</legend>",
      ">Jumlah lot</label>",
      ">Harga limit</label>",
      ">Pasang order</button>",
    ],
    hints: [
      "Anda dapat membeli saham LQ45 yang memiliki imbal hasil bulanan yang dibutuhkan ukuran portofolio, dan menjual saham yang Anda pegang.",
      "Satu lot berisi 100 saham. Satu order berisi 1 lot sampai 50.000 lot, yaitu order terbesar yang diterima BEI.",
      "Dalam rupiah bulat. Hanya order limit yang memakainya. Pembelian tereksekusi pada harga ini atau lebih rendah, dan penjualan pada harga ini atau lebih tinggi.",
    ],
    placeholder: "Pilih saham",
    options: [
      ">Beli</label>",
      ">Jual</label>",
      ">Order harga pasar</label>",
      ">Order limit</label>",
    ],
  },
  en: {
    day: "An order that you place now can fill at a delayed price quoted in session I or session II on November 2, 2026, from 9:00 AM WIB, and it expires at 4:26 PM WIB if it has not filled by then.",
    labels: [
      ">Stock</label>",
      ">Buy or sell</legend>",
      ">Kind of order</legend>",
      ">Lots</label>",
      ">Limit price</label>",
      ">Place the order</button>",
    ],
    hints: [
      "You can buy a stock of the LQ45 that has the monthly returns that the measures of a portfolio need, and sell a stock that you hold.",
      "A lot is 100 shares. An order has 1 lot to 50,000 lots, the largest order that IDX accepts.",
      "In whole rupiah. Only a limit order uses it. A purchase fills at this price or lower, and a sale at this price or higher.",
    ],
    placeholder: "Choose a stock",
    options: [
      ">Buy</label>",
      ">Sell</label>",
      ">Market order</label>",
      ">Limit order</label>",
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`offers the stocks, the sides, and the kinds of order with the trading day of an order placed now, and chooses a market order first, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = renderInRouterForTest(
      <OrderForm
        codes={["BBCA", "TLKM"]}
        day={monday}
        fields={undefined}
        failure={undefined}
      />,
    );
    for (const expected of [
      text.day,
      ...text.labels,
      ...text.hints,
      ...text.options,
      `<option value="" selected="">${text.placeholder}</option>`,
      '<option value="BBCA">BBCA</option>',
      '<option value="TLKM">TLKM</option>',
    ]) {
      expect(html).toContain(expected);
    }
    expect(html).toMatch(/checked="" value="market"/);
    expect(html).not.toMatch(/checked="" value="limit"/);
    expect(html).not.toMatch(/checked="" value="(buy|sell)"/);
    expect(html).not.toContain('role="alert"');
  });
}

test("shows what the student sent, the reason at each field, and the reason above the form", () => {
  const html = renderInRouterForTest(
    <OrderForm
      codes={["BBCA", "TLKM"]}
      day={monday}
      fields={{
        ...blankOrderForm,
        code: "TLKM",
        side: "sell",
        priceKind: "limit",
        lots: "5",
        limit: "2.000",
        limitFailure: "The reason of the limit price.",
      }}
      failure="The reason of the order."
    />,
  );
  expect(html).toContain('<option value="TLKM" selected="">TLKM</option>');
  expect(html).toMatch(/checked="" value="sell"/);
  expect(html).toMatch(/checked="" value="limit"/);
  expect(html).toContain('value="5"');
  expect(html).toContain('value="2.000"');
  expect(html).toContain("The reason of the limit price.</p>");
  expect(html).toContain('role="alert"');
  expect(html).toContain("The reason of the order.</p>");
});
