import { studentReasonsSectionId } from "./student-reasons-section-id";
import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { activityOrderForTest } from "./activity-for-test";
import { orderLotsForTest } from "./orders-for-test";
import { ReasonSection } from "./reason-section";

const reason = "Bank besar.\n\nBeta rendah.";
const text: Record<
  Locale,
  { title: string; empty: string; placed: string; titles: readonly string[] }
> = {
  id: {
    title: "Alasan order",
    empty: "Mahasiswa belum menulis alasan untuk order mana pun.",
    placed:
      "Dipasang pada 2 Nov 2026, 10.00 WIB untuk hari bursa 2 November 2026.",
    titles: [
      "Beli 1 lot BBCA pada harga pasar",
      "Beli 5 lot BBCA pada harga pasar",
      "Jual 1 lot BBCA pada harga pasar",
      "Jual 5 lot BBCA pada harga pasar",
      "Beli 1 lot BBCA dengan limit Rp\u00a04.950",
      "Beli 5 lot BBCA dengan limit Rp\u00a04.950",
      "Jual 1 lot BBCA dengan limit Rp\u00a04.950",
      "Jual 5 lot BBCA dengan limit Rp\u00a04.950",
    ],
  },
  en: {
    title: "Reasons for the orders",
    empty: "Mahasiswa has not written a reason for any order yet.",
    placed:
      "Placed on Nov 2, 2026, 10:00 AM WIB for the trading day November 2, 2026.",
    titles: [
      "Buy 1 lot of BBCA at the market price",
      "Buy 5 lots of BBCA at the market price",
      "Sell 1 lot of BBCA at the market price",
      "Sell 5 lots of BBCA at the market price",
      "Buy 1 lot of BBCA at a limit of IDR\u00a04,950",
      "Buy 5 lots of BBCA at a limit of IDR\u00a04,950",
      "Sell 1 lot of BBCA at a limit of IDR\u00a04,950",
      "Sell 5 lots of BBCA at a limit of IDR\u00a04,950",
    ],
  },
};

for (const locale of locales) {
  test(`keeps the lecturer's list of reasons with each order's side, lots, price, time, and paragraphs in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const orders = [];
    for (const price of [
      { kind: "market" },
      { kind: "limit", limit: rupiah(4_950) },
    ] as const) {
      for (const side of ["buy", "sell"] as const) {
        for (const count of [1, 5])
          orders.push(
            activityOrderForTest(orders.length + 1, {
              side,
              price,
              lots: orderLotsForTest(count),
              reason,
            }),
          );
      }
    }
    const markup = renderMarkupForTest(
      <ReasonSection orders={orders} studentName="Mahasiswa" />,
    );
    for (const title of text[locale].titles) expect(markup).toContain(title);
    expect(markup).toContain(`<h2>${text[locale].title}</h2>`);
    expect(markup).toContain(text[locale].placed);
    expect(markup.match(/<li>/g)).toHaveLength(orders.length);
    expect(markup).toContain(`<p>${reason}</p>`);
    expect(markup.indexOf(text[locale].titles[7] ?? "")).toBeLessThan(
      markup.indexOf(text[locale].titles[0] ?? ""),
    );
    for (const empty of [[], [activityOrderForTest(1)]])
      expect(
        renderMarkupForTest(
          <ReasonSection orders={empty} studentName="Mahasiswa" />,
        ),
      ).toBe(
        `<section id="${studentReasonsSectionId}"><h2>${text[locale].title}</h2><p>${text[locale].empty}</p></section>`,
      );
  });
}
