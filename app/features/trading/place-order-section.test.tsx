import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { succeed } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { orderDayOf } from "./order-form";
import { orderTradingDay } from "./order-trading-day";
import type { TradingDayFailure } from "./order-trading-day";
import { bbcaForTest, mondayTradingDayForTest } from "./orders-for-test";
import { PlaceOrderSection } from "./place-order-section";

// An order placed at 16:00 WIB on Thursday 30 December 2027 trades on a day of 2028, which no calendar covers, and one placed at 10:00 WIB on Friday 30 October 2026 trades before the first recorded fee schedule.
const moments: Record<TradingDayFailure["kind"], Date> = {
  missingRules: new Date("2027-12-30T09:00:00Z"),
  missingCosts: new Date("2026-10-30T03:00:00Z"),
};
const kinds = [
  "missingRules",
  "missingCosts",
] as const satisfies readonly TradingDayFailure["kind"][];

const texts: Record<Locale, Record<TradingDayFailure["kind"], string>> = {
  id: {
    missingRules:
      "Portolab belum dapat menerima order saat ini, karena aturan BEI untuk hari bursa order yang Anda pasang sekarang belum tercatat. Beri tahu dosen Anda agar aturan tersebut dapat ditambahkan.",
    missingCosts:
      "Portolab belum dapat menerima order saat ini, karena tarif biaya broker atau pajak final atas penjualan untuk hari bursa order yang Anda pasang sekarang belum tercatat. Beri tahu dosen Anda agar tarif yang belum tercatat itu dapat ditambahkan.",
  },
  en: {
    missingRules:
      "Portolab cannot take an order now, because it has not recorded the rules of IDX for the trading day of an order that you place now. Tell your lecturer, so that the rules can be added.",
    missingCosts:
      "Portolab cannot take an order now, because it lacks a record of the broker fee or of the final tax on sales for the trading day of an order that you place now. Tell your lecturer, so that the missing rates can be added.",
  },
};

for (const locale of locales) {
  test(`explains in place of the order form that Portolab cannot take an order now while the trading day of an order lacks the rules of IDX or the costs, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const kind of kinds) {
      const day = orderTradingDay(moments[kind], bbcaForTest.delayMinutes);
      expect(day.ok ? undefined : day.failure.kind, kind).toBe(kind);
      if (!day.ok) {
        expect(
          renderInRouterForTest(
            <PlaceOrderSection
              day={day}
              codes={["BBCA"]}
              fields={undefined}
              failure={undefined}
            />,
          ),
          kind,
        ).toBe(`<p>${texts[locale][kind]}</p>`);
      }
    }
  });
}

test("offers the order form while the trading day of an order has its records", () => {
  const html = renderInRouterForTest(
    <PlaceOrderSection
      day={succeed(orderDayOf(mondayTradingDayForTest))}
      codes={["BBCA"]}
      fields={undefined}
      failure={undefined}
    />,
  );
  expect(html).toContain("<form");
  expect(html).toContain('<option value="BBCA">BBCA</option>');
});
