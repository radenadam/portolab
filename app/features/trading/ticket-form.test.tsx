import { activityPath } from "./activity-path";
import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import type { Locale } from "~/paraglide/runtime.js";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { rupiah } from "~/units/rupiah";
import { lots } from "~/units/lots";
import { shares } from "~/units/shares";
import { parseRecordId } from "~/value-parsers";
import type { ClassId } from "~/features/classes/classes.schema";
import { successValueForTest } from "~/success-value-for-test";
import { blankOrderForm } from "./order-form-fields";
import {
  bbcaForTest,
  duringSessionForTest,
  purchaseForTest,
  acceptedForTest,
} from "./orders-for-test";
import { studentWithQuotesForTest } from "./portfolios-for-test.server";
import { readPortfolio } from "./portfolio-store.server";
import { readTicket } from "./read-ticket.server";
import { TicketForm } from "./ticket-form";
import { TicketDone } from "./ticket-done";
import { checkOrder } from "./check-order";

const texts: Record<
  Locale,
  {
    marketNow: string;
    buyAmounts: readonly string[];
    sellAmounts: readonly string[];
    buyReason: string;
    sellReason: string;
    labels: readonly string[];
    limit: readonly string[];
    schedules: readonly string[];
    filled: readonly string[];
    ended: string;
    step: string;
  }
> = {
  id: {
    buyAmounts: [
      "Rp\u00a02.490.000",
      "+Rp\u00a03.735",
      "Rp\u00a02.493.735",
      "Rp\u00a097.506.265",
    ],
    sellAmounts: [
      "Rp\u00a0498.000",
      "-Rp\u00a0747",
      "-Rp\u00a0498",
      "Rp\u00a0496.755",
      "Rp\u00a0100.496.755",
    ],
    buyReason: "Mengapa Anda membeli BBCA?",
    sellReason: "Mengapa Anda menjual BBCA?",
    marketNow: "Terisi sekarang di harga tertunda terakhir, Rp\u00a04.980.",
    labels: [
      "Jenis order",
      "Rincian biaya",
      "Pasar",
      "Limit",
      "Pasang order",
      "kas tersedia Rp\u00a0100.000.000",
      "Order harga pasar memakai harga tertunda pertama dari sesi order. Order limit menunggu harga yang mencapai limit Anda.",
      "Biaya broker dan pajak dihitung dari nilai saham, lalu masing-masing dibulatkan ke rupiah terdekat. Penjualan membayar pajak final.",
      "Satu lot berisi 100 saham. Satu order berisi 1 lot sampai 50.000 lot, yaitu order terbesar yang diterima BEI.",
    ],
    limit: [
      "Turunkan harga satu fraksi",
      "Naikkan harga satu fraksi",
      "ARB 4.640",
      "ARA 6.225",
      "acuan 4.980",
      "ARA dan ARB",
      "Harga acuan Rp\u00a04.980 memberi rentang harga sah dari Rp\u00a04.640 sampai Rp\u00a06.225. Harga limit harus mengikuti fraksi harga BEI.",
      "Ubah ke Rp\u00a04.980",
    ],
    schedules: [
      "Order dapat terisi dari harga tertunda sesi yang mulai 2 Nov 2026, 09.00 WIB. Order yang belum terisi kedaluwarsa pada 2 Nov 2026, 16.26 WIB.",
      "Order dapat terisi dari harga tertunda sesi yang mulai 2 Nov 2026, 13.30 WIB. Order yang belum terisi kedaluwarsa pada 2 Nov 2026, 16.26 WIB.",
      "Order dapat terisi dari harga tertunda sesi yang mulai 6 Nov 2026, 14.00 WIB. Order yang belum terisi kedaluwarsa pada 6 Nov 2026, 16.26 WIB.",
      "Order dapat terisi dari harga tertunda sesi yang mulai 9 Nov 2026, 09.00 WIB. Order yang belum terisi kedaluwarsa pada 9 Nov 2026, 16.26 WIB.",
    ],
    filled: [
      "Order terisi",
      "Beli 5 lot BBCA.",
      "Terisi pada harga Rp\u00a04.980, 2 Nov 2026, 09.50 WIB.",
    ],
    ended: "Order berakhir",
    step: "Ubah ke 4 lot",
  },
  en: {
    buyAmounts: [
      "IDR\u00a02,490,000",
      "+IDR\u00a03,735",
      "IDR\u00a02,493,735",
      "IDR\u00a097,506,265",
    ],
    sellAmounts: [
      "IDR\u00a0498,000",
      "-IDR\u00a0747",
      "-IDR\u00a0498",
      "IDR\u00a0496,755",
      "IDR\u00a0100,496,755",
    ],
    buyReason: "Why are you buying BBCA?",
    sellReason: "Why are you selling BBCA?",
    marketNow: "Fills now at the latest delayed price, IDR\u00a04,980.",
    labels: [
      "Kind of order",
      "Cost breakdown",
      "Market",
      "Limit",
      "Place the order",
      "available cash IDR\u00a0100,000,000",
      "A market order uses the first delayed price from its session. A limit order waits for a price that reaches your limit.",
      "The broker fee and tax are calculated from the value of the shares, then each is rounded to the nearest rupiah. A sale pays the final tax.",
      "A lot is 100 shares. An order has 1 lot to 50,000 lots, the largest order that IDX accepts.",
    ],
    limit: [
      "Decrease the price by one tick",
      "Increase the price by one tick",
      "ARB 4,640",
      "ARA 6,225",
      "reference 4,980",
      "ARA and ARB",
      "The reference price of IDR\u00a04,980 gives a valid price range from IDR\u00a04,640 to IDR\u00a06,225. A limit price must follow the tick sizes of IDX.",
      "Change to IDR\u00a04,980",
    ],
    schedules: [
      "The order can fill from delayed prices of the session starting on Nov 2, 2026, 9:00 AM WIB. An unfilled order expires on Nov 2, 2026, 4:26 PM WIB.",
      "The order can fill from delayed prices of the session starting on Nov 2, 2026, 1:30 PM WIB. An unfilled order expires on Nov 2, 2026, 4:26 PM WIB.",
      "The order can fill from delayed prices of the session starting on Nov 6, 2026, 2:00 PM WIB. An unfilled order expires on Nov 6, 2026, 4:26 PM WIB.",
      "The order can fill from delayed prices of the session starting on Nov 9, 2026, 9:00 AM WIB. An unfilled order expires on Nov 9, 2026, 4:26 PM WIB.",
    ],
    filled: [
      "Order filled",
      "Buy 5 lots of BBCA.",
      "Filled at IDR\u00a04,980, Nov 2, 2026, 9:50 AM WIB.",
    ],
    ended: "Order ended",
    step: "Change to 4 lots",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`shows the rules, correction links, costs, and the same schedule on the form and success state in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { database, owner } = await studentWithQuotesForTest(
      [bbcaForTest.quote],
      duringSessionForTest,
    );
    const moments = [
      duringSessionForTest,
      new Date("2026-11-02T05:00:00Z"),
      new Date("2026-11-06T05:00:00Z"),
      new Date("2026-11-06T09:00:00Z"),
    ];
    for (const [index, now] of moments.entries()) {
      const ticket = readTicket(database, readPortfolio(database, owner), {
        code: "BBCA",
        now,
        delayMinutes: 10,
      });
      const html = renderMarkupForTest(
        <TicketForm
          code="BBCA"
          side="buy"
          path="/classes/1/stocks/BBCA"
          search=""
          ticket={ticket}
          fields={{ ...blankOrderForm, lots: "5" }}
          rejection={{ text: "Cash", lotsStep: lots(4), field: "lots" }}
          limitSteps={undefined}
          restoreDraft={false}
        />,
        conceptLessonDataForTest(),
      );
      expect(html).toContain(
        markupTextForTest(
          index === 0
            ? text.marketNow
            : (text.schedules[index] ?? "missing schedule"),
        ),
      );
      const waitingOrder = acceptedForTest(
        purchaseForTest({ placedAt: now }),
        { cash: rupiah(100_000_000), holdings: [], orders: [] },
        bbcaForTest,
      );
      const waitingClassId = successValueForTest(
        parseRecordId<ClassId>("1", "classId"),
        "The class id is valid",
      );
      const checked = checkOrder({
        order: waitingOrder,
        quote: bbcaForTest.quote,
        moment: now,
        availableCash: rupiah(100_000_000),
        sharesOfStock: {
          held: shares(0),
          setAside: { amount: shares(0), orders: 0 },
        },
      });
      const waiting = renderMarkupForTest(
        <TicketDone
          closePath="/classes/1/stocks/BBCA"
          order={{ ...waitingOrder, state: checked }}
          activity={activityPath(waitingClassId)}
          now={now}
        />,
      );
      expect(waiting).toContain(
        markupTextForTest(
          index === 0
            ? (text.filled[0] ?? "missing fill")
            : (text.schedules[index] ?? "missing schedule"),
        ),
      );
      for (const amount of text.buyAmounts) expect(html).toContain(amount);
      expect(html).toContain(text.step);
      expect(html).toContain(`placeholder="${text.buyReason}"`);
      for (const label of text.labels.filter(
        (value) => !["Pasang order", "Place the order"].includes(value),
      ))
        expect(html).toContain(markupTextForTest(label));
      expect(html.match(/type="submit"/g)).toHaveLength(1);
    }
    const ticket = readTicket(database, readPortfolio(database, owner), {
      code: "BBCA",
      now: duringSessionForTest,
      delayMinutes: 10,
    });
    const limit = renderMarkupForTest(
      <TicketForm
        code="BBCA"
        side="sell"
        path="/classes/1/stocks/BBCA"
        search=""
        ticket={ticket}
        fields={{
          ...blankOrderForm,
          priceKind: "limit",
          lots: "1",
          limit: "4980",
        }}
        rejection={undefined}
        limitSteps={[rupiah(4980)]}
        restoreDraft={false}
      />,
      conceptLessonDataForTest(),
    );
    for (const amount of text.sellAmounts) expect(limit).toContain(amount);
    expect(limit).toContain(`placeholder="${text.sellReason}"`);
    for (const value of text.limit)
      expect(limit).toContain(markupTextForTest(value));
    const order = acceptedForTest(
      purchaseForTest(),
      { cash: rupiah(100_000_000), holdings: [], orders: [] },
      bbcaForTest,
    );
    const state = checkOrder({
      order,
      quote: bbcaForTest.quote,
      moment: duringSessionForTest,
      availableCash: rupiah(100_000_000),
      sharesOfStock: {
        held: shares(0),
        setAside: { amount: shares(0), orders: 0 },
      },
    });
    expect(state.kind).toBe("filled");
    const classId = successValueForTest(
      parseRecordId<ClassId>("1", "classId"),
      "The class id is valid",
    );
    const done = renderMarkupForTest(
      <TicketDone
        closePath="/classes/1/stocks/BBCA"
        order={{ ...order, state }}
        activity={activityPath(classId)}
        now={duringSessionForTest}
      />,
    );
    for (const value of text.filled)
      expect(done).toContain(markupTextForTest(value));
    const ended = renderMarkupForTest(
      <TicketDone
        closePath="/classes/1/stocks/BBCA"
        order={order}
        activity={activityPath(classId)}
        now={order.expiresAt}
      />,
    );
    expect(ended).toContain(text.ended);
  });
}
