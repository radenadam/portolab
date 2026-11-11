import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { lots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import { OrderForm, orderDayOf } from "./order-form";
import { blankOrderForm } from "./order-form-fields";
import { mondayTradingDayForTest } from "./orders-for-test";

// The trading day of an order placed at 10:00 WIB on Monday 2 November 2026.
const monday = orderDayOf(mondayTradingDayForTest);

const texts: Record<
  Locale,
  {
    day: string;
    labels: readonly string[];
    hints: readonly string[];
    options: readonly string[];
    rejectedTitle: string;
    lotsSteps: readonly (readonly [Lots, string])[];
  }
> = {
  id: {
    day: "Order yang Anda pasang sekarang dapat tereksekusi pada harga tertunda yang tercatat pada sesi I atau sesi II tanggal 2 November 2026, mulai pukul 09.00 WIB, dan kedaluwarsa pada pukul 16.26 WIB jika belum tereksekusi.",
    labels: [
      ">Beli atau jual</legend>",
      ">Jenis order</legend>",
      ">Jumlah lot</label>",
      ">Harga limit</label>",
      ">Pasang order</button>",
    ],
    hints: [
      "Satu lot berisi 100 saham. Satu order berisi 1 lot sampai 50.000 lot, yaitu order terbesar yang diterima BEI.",
      "Dalam rupiah bulat. Hanya order limit yang memakainya. Pembelian tereksekusi pada harga ini atau lebih rendah, dan penjualan pada harga ini atau lebih tinggi.",
    ],
    options: [
      ">Beli</label>",
      ">Jual</label>",
      ">Order harga pasar</label>",
      ">Order limit</label>",
    ],
    rejectedTitle: "Portolab tidak menerima order ini",
    lotsSteps: [
      [lots(1), 'value="1" name="lotsStep">Ubah menjadi 1 lot</button>'],
      [
        lots(18_000),
        'value="18.000" name="lotsStep">Ubah menjadi 18.000 lot</button>',
      ],
    ],
  },
  en: {
    day: "An order that you place now can fill at a delayed price quoted in session I or session II on November 2, 2026, from 9:00 AM WIB, and it expires at 4:26 PM WIB if it has not filled by then.",
    labels: [
      ">Buy or sell</legend>",
      ">Kind of order</legend>",
      ">Lots</label>",
      ">Limit price</label>",
      ">Place the order</button>",
    ],
    hints: [
      "A lot is 100 shares. An order has 1 lot to 50,000 lots, the largest order that IDX accepts.",
      "In whole rupiah. Only a limit order uses it. A purchase fills at this price or lower, and a sale at this price or higher.",
    ],
    options: [
      ">Buy</label>",
      ">Sell</label>",
      ">Market order</label>",
      ">Limit order</label>",
    ],
    rejectedTitle: "Portolab did not accept this order",
    lotsSteps: [
      [lots(1), 'value="1" name="lotsStep">Change to 1 lot</button>'],
      [
        lots(18_000),
        'value="18,000" name="lotsStep">Change to 18,000 lots</button>',
      ],
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];

  test(`offers the sides and the kinds of order with the trading day of an order placed now, and chooses a market order first, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const html = renderInRouterForTest(
      <OrderForm day={monday} fields={undefined} rejection={undefined} />,
    );
    for (const expected of [
      text.day,
      ...text.labels,
      ...text.hints,
      ...text.options,
    ]) {
      expect(html).toContain(expected);
    }
    expect(html).toMatch(/checked="" value="market"/);
    expect(html).not.toMatch(/checked="" value="limit"/);
    expect(html).not.toMatch(/checked="" value="(buy|sell)"/);
    expect(html).not.toContain('role="alert"');
    // The address of the page chooses the stock, so the form sends none.
    expect(html).not.toContain('name="code"');
  });

  test(`opens a rejection with its title above the fields, and offers its lots as a button of a form of its own that sends them with the other fields of the rejected order, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const [lotsStep, button] of text.lotsSteps) {
      // The names of the classes of CSS modules carry a hash, so the test compares the markup without them.
      const html = renderInRouterForTest(
        <OrderForm
          day={monday}
          fields={{
            ...blankOrderForm,
            side: "buy",
            lots: "25",
            limit: "9.875",
          }}
          rejection={{ text: "The reason of the order.", lotsStep }}
        />,
      ).replaceAll(/ class="[^"]*"/g, "");
      expect(html).toContain(
        `<div role="alert"><p>${text.rejectedTitle}</p><p>The reason of the order.</p><form data-discover="true" action="/" method="post"><input type="hidden" name="side" value="buy"/><input type="hidden" name="priceKind" value="market"/><input type="hidden" name="limit" value="9.875"/><button type="submit" ${button}</form></div><form`,
      );
      // Enter in a field sends a form with its first submit button, so the form of the fields holds only the button that places the order.
      const fieldsForm = html.slice(html.lastIndexOf("<form"));
      expect(fieldsForm.match(/type="submit"/g)).toHaveLength(1);
      expect(fieldsForm).toContain('value="25"');
    }
  });
}

test("shows what the student sent, the reason at each field, and a rejection without a step above the fields", () => {
  const html = renderInRouterForTest(
    <OrderForm
      day={monday}
      fields={{
        ...blankOrderForm,
        side: "sell",
        priceKind: "limit",
        lots: "5",
        limit: "2.000",
        limitFailure: "The reason of the limit price.",
      }}
      rejection={{ text: "The reason of the order.", lotsStep: undefined }}
    />,
  );
  expect(html).toMatch(/checked="" value="sell"/);
  expect(html).toMatch(/checked="" value="limit"/);
  expect(html).toContain('value="5"');
  expect(html).toContain('value="2.000"');
  expect(html).toContain("The reason of the limit price.</p>");
  expect(html).toContain('role="alert"');
  expect(html).toContain("The reason of the order.</p></div>");
  expect(html).not.toContain('name="lotsStep"');
});
