import { expect, test } from "vitest";
import { orderLotsForTest } from "~/features/trading/orders-for-test";
import type { OrderSide } from "~/features/trading/order";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { LatestStudentReason } from "./latest-student-reason";

const headings: Record<Locale, Record<OrderSide, string>> = {
  id: {
    buy: "beli 2 lot BBCA · 2 Nov 2026, 10.00 WIB",
    sell: "jual 2 lot BBCA · 2 Nov 2026, 10.00 WIB",
  },
  en: {
    buy: "bought 2 lots of BBCA · Nov 2, 2026, 10:00 AM WIB",
    sell: "sold 2 lots of BBCA · Nov 2, 2026, 10:00 AM WIB",
  },
};

for (const locale of locales) {
  test(`names the filled order and its fill time and quotes the student's reason in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const side of ["buy", "sell"] as const) {
      const html = renderInRouterForTest(
        <LatestStudentReason
          name="Sari Wulandari"
          reason={{
            code: "BBCA",
            lots: orderLotsForTest(2),
            side,
            filledAt: new Date("2026-11-02T03:00:00Z"),
            reason: "Catatan mahasiswa",
          }}
        />,
      );
      expect(html).toContain(markupTextForTest(headings[locale][side]));
      expect(html).toMatch(/<q[^>]*>.*Catatan mahasiswa.*<\/q>/u);
      expect(html).toContain(`data-initials="SW" aria-hidden="true"`);
    }
  });
}
