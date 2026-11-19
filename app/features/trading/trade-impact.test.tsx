import { measureFailureText } from "~/features/measures/measure-failure-text";
import { orderFailureText } from "./order-failure-text";
import type { TradePreview } from "./preview-trade";
import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import { successValueForTest } from "~/success-value-for-test";
import { rupiah } from "~/units/rupiah";
import { fail } from "~/result";
import { tradePortfolioForTest } from "./trade-portfolio-for-test.server";
import { StockImpact, unpricedImpactText } from "./stock-impact";
import { TradeImpact } from "./trade-impact";
import { previewTrade } from "./preview-trade";
import {
  purchaseForTest,
  orderLotsForTest,
  duringSessionForTest,
  bbcaForTest,
} from "./orders-for-test";
import { readTicket } from "./read-ticket.server";
import type { ClassId } from "~/features/classes/classes.schema";

const classId = 7 as ClassId;

// Python Decimal of preview-trade.test.ts also gives the trade cost as 9.1% of the portfolio when rounded to one decimal.
const texts: Record<
  Locale,
  {
    labels: readonly string[];
    share: string;
    open: string;
    purchase: string;
    limited: string;
    small: string;
    months: string;
    basis: string;
    ticketAxis: string;
    missing: readonly string[];
    values: readonly string[];
  }
> = {
  id: {
    ticketAxis: "Sumbu risiko dampak order di tiket",
    labels: [
      "Dampak ke portofolio",
      "Perbandingan ini memakai harga tertunda yang sama dan bulan yang sama sebelum dan sesudah order, sehingga perubahannya berasal dari order dan biayanya. Order limit dihitung pada harga limit.",
      "Beta",
      "Risiko/bln",
      "Imbal hasil harapan/bln",
      "Simpangan baku",
      "Bobot BBCA",
      "Bobot Keuangan",
      "Bobot sektor",
      "Bobot sektor adalah jumlah bobot saham yang termasuk sektor IDX-IC yang sama. Kas tetap dihitung dalam nilai portofolio, tetapi tidak termasuk suatu sektor.",
      "Beta 0,62 menjadi 0,68.",
      "Saham",
      "Sekarang",
      "Sesudah",
      "Peta sebelum dan sesudah order",
      "Sumbu risiko dampak order",
      "SML",
      "Tabel nilai pada peta dan SML",
      "Titik",
      "Bobot sekarang",
      "Bobot sesudah",
    ],
    share: "Bagian portofolio",
    open: "Buka tiket dengan 10 lot",
    purchase:
      "Jika Anda membeli 10 lot BBCA dari kas, senilai Rp\u00a04.987.470 atau sekitar 9,1% portofolio:",
    limited:
      "Jika Anda memakai kas yang tersedia untuk membeli 2 lot BBCA, senilai Rp\u00a0997.494:",
    small:
      "Anggaran 10% portofolio belum cukup untuk 1 lot BBCA yang memerlukan Rp\u00a0498.747. Buka tiket untuk menentukan jumlah lot.",
    months:
      "Portofolio Anda memakai 60 bulan. Perbandingan ini memakai 38 imbal hasil bulanan yang sama sebelum dan sesudah order, dari Agustus 2023 sampai September 2026, karena mencakup saham order ini.",
    basis:
      "Sumbu tegak menunjukkan imbal hasil harapan per bulan. Kedua portofolio dan saham order memakai 60 imbal hasil bulanan yang sama, dari Oktober 2021 sampai September 2026. Pada sumbu beta, SML melewati tingkat bebas risiko dan IHSG.",
    missing: [
      "Dampak belum dapat dihitung karena WIFI belum memiliki harga tertunda untuk menentukan bobotnya. Periksa kembali setelah pembaruan harga berikutnya membawa harga tertunda WIFI.",
      "Dampak belum dapat dihitung karena WIFI dan UNVR belum memiliki harga tertunda untuk menentukan bobotnya. Periksa kembali setelah pembaruan harga berikutnya membawa harga tertunda WIFI dan UNVR.",
    ],
    values: [
      "0,62",
      "0,68",
      "4,07%",
      "4,50%",
      "-0,22%",
      "-0,23%",
      "50,0%",
      "59,1%",
    ],
  },
  en: {
    ticketAxis: "Ticket trade impact risk axis",
    labels: [
      "Portfolio impact",
      "This comparison uses the same delayed prices and months before and after the order, so the change comes from the order and its costs. A limit order is calculated at its limit price.",
      "Beta",
      "Risk/mo",
      "Expected return/mo",
      "Standard deviation",
      "BBCA weight",
      "Financials weight",
      "Sector weight",
      "Sector weight is the sum of the weights of stocks in the same IDX-IC sector. Cash remains part of the portfolio value but belongs to no sector.",
      "Beta 0.62 becomes 0.68.",
      "Stock",
      "Now",
      "After",
      "Map before and after the order",
      "Trade impact risk axis",
      "SML",
      "Table of map values and SML",
      "Point",
      "Weight now",
      "Weight after",
    ],
    share: "Share of portfolio",
    open: "Open ticket with 10 lots",
    purchase:
      "If you buy 10 lots of BBCA from cash, costing IDR\u00a04,987,470 or about 9.1% of the portfolio:",
    limited:
      "If you use available cash to buy 2 lots of BBCA, costing IDR\u00a0997,494:",
    small:
      "The budget of 10% of the portfolio does not cover 1 lot of BBCA, which costs IDR\u00a0498,747. Open the ticket to set the number of lots.",
    months:
      "Your portfolio uses 60 months. This comparison uses the same 38 monthly returns before and after the order, from August 2023 to September 2026, because it includes the stock of this order.",
    basis:
      "The vertical axis shows expected monthly return. Both portfolios and the stock of the order use the same 60 monthly returns, from October 2021 to September 2026. On the beta axis, the SML runs through the risk-free rate and IHSG.",
    missing: [
      "The impact cannot be calculated because WIFI has no delayed price to determine its weight. Check again when the next price update brings a delayed price for WIFI.",
      "The impact cannot be calculated because WIFI and UNVR have no delayed prices to determine their weights. Check again when the next price update brings delayed prices for WIFI and UNVR.",
    ],
    values: [
      "0.62",
      "0.68",
      "4.07%",
      "4.50%",
      "-0.22%",
      "-0.23%",
      "50.0%",
      "59.1%",
    ],
  },
};

for (const locale of locales) {
  const text = texts[locale];
  test(`keeps the buy ticket and learning context from the stock and both ticket sides in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { ticket } = await tradePortfolioForTest();
    for (const path of [
      "/classes/7/stocks/BBCA",
      "/classes/7/stocks/BBCA/buy",
      "/classes/7/stocks/BBCA/sell",
    ]) {
      const html = renderMarkupForTest(
        <StockImpact classId={classId} ticket={ticket} code="BBCA" />,
        conceptLessonDataForTest(),
        `${path}?range=3m&lessonTask=9&lots=3&placed=77`,
      );
      expect(html).toContain(
        'href="/classes/7/stocks/BBCA/buy?range=3m&amp;lessonTask=9&amp;lots=10"',
      );
    }
  });
  test(`shows the preview, its calculations, and each cash state in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { ticket, database, portfolio } = await tradePortfolioForTest();
    const html = renderMarkupForTest(
      <StockImpact classId={classId} ticket={ticket} code="BBCA" />,
      conceptLessonDataForTest(),
    );
    for (const label of [
      ...text.labels,
      text.purchase,
      text.basis,
      ...text.values,
    ])
      expect(html).toContain(markupTextForTest(label));
    // The size of the example purchase sits under the title with its visible label, and the button that opens the ticket ends the sentence that the size changes.
    expect(html).toContain(
      `</h2><div><span>${text.share}</span><nav aria-label="${text.share}">`,
    );
    expect(html).toContain(
      `<div><p>${markupTextForTest(text.purchase)}</p><a href="/classes/7/stocks/BBCA/buy?lots=10" data-discover="true">${text.open}</a></div>`,
    );
    for (const [cash, expected] of [
      [1_000_000, text.limited],
      [2_500_000, text.small],
    ] as const) {
      const ticket = readTicket(
        database,
        {
          ...portfolio,
          cash: rupiah(cash),
          ...(cash === 2_500_000 ? { holdings: [] } : {}),
        },
        {
          code: "BBCA",
          now: duringSessionForTest,
          delayMinutes: bbcaForTest.delayMinutes,
        },
      );
      expect(ticket.available).toBe(cash);
      expect(
        renderMarkupForTest(
          <StockImpact classId={classId} ticket={ticket} code="BBCA" />,
          conceptLessonDataForTest(),
        ),
      ).toContain(markupTextForTest(expected));
    }
    for (const [codes, expected] of [
      [["WIFI"], text.missing[0]],
      [["WIFI", "UNVR"], text.missing[1]],
    ] as const) {
      expect(unpricedImpactText(codes)).toBe(expected);
      expect(
        renderMarkupForTest(
          <StockImpact
            classId={classId}
            ticket={{ ...ticket, impact: fail([...codes]) }}
            code="BBCA"
          />,
          conceptLessonDataForTest(),
        ),
      ).toContain(markupTextForTest(expected ?? ""));
    }
  });
  test(`keeps recovery steps specific to each portfolio owner in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { ticket } = await tradePortfolioForTest();
    const records = {
      kind: "missingRules",
      reason: "The fixture has no calendar.",
    } as const;
    const rate = { kind: "noRiskFreeRate", date: "2026-10-31" } as const;
    for (const portfolioKind of ["membership", "demonstration"] as const) {
      const expected = orderFailureText(records, portfolioKind);
      expect(
        renderMarkupForTest(
          <StockImpact
            classId={classId}
            code="BBCA"
            ticket={{ ...ticket, day: fail(records) }}
            portfolioKind={portfolioKind}
          />,
          conceptLessonDataForTest(),
        ),
      ).toContain(markupTextForTest(expected));
      const cases: { preview: TradePreview; text: string }[] = [
        { preview: fail({ kind: "order", failure: records }), text: expected },
        {
          preview: fail({ kind: "measures", failure: rate }),
          text: measureFailureText(rate, {
            kind: "portfolio",
            reader: { kind: "owner", portfolioKind },
          }),
        },
      ];
      for (const { preview, text } of cases)
        expect(
          renderMarkupForTest(
            <TradeImpact
              preview={preview}
              code="BBCA"
              portfolioKind={portfolioKind}
            />,
          ),
        ).toContain(markupTextForTest(text));
    }
  });
  test(`names the common months when a new stock shortens the comparison in ${languageNames[locale]}`, async () => {
    switchLocaleForTest(locale);
    const { ticket } = await tradePortfolioForTest("AMMN");
    const preview = previewTrade(
      successValueForTest(ticket.impact, "The portfolio is priced"),
      purchaseForTest({ code: "AMMN", lots: orderLotsForTest(10) }),
      {
        day: successValueForTest(ticket.day, "The day is recorded"),
        quote: ticket.quote,
      },
    );
    expect(preview).toMatchObject({
      ok: true,
      value: { originalMonths: { count: 60 } },
    });
    const html = renderMarkupForTest(
      <TradeImpact preview={preview} code="AMMN" ticket />,
      conceptLessonDataForTest(),
    );
    expect(html).toContain(markupTextForTest(text.months));
    expect(html).toContain(`aria-label="${text.ticketAxis}"`);
  });
}
