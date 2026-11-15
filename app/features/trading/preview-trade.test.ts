import { expect, test } from "vitest";
import { successValueForTest } from "~/success-value-for-test";
import { deleteStockClosesBeforeForTest } from "~/features/market-data/delete-stock-closes-before-for-test.server";
import {
  cashValuationForTest,
  ammnValuationForTest,
} from "~/features/measures/measures-for-test.server";
import { portfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import { closeToForTest } from "~/features/measures/close-to-for-test";
import { tradePortfolioForTest } from "./trade-portfolio-for-test.server";
import { previewTrade } from "./preview-trade";
import { stockImpactLots } from "./stock-impact-lots";
import { sectorWeight } from "./sector-weight";
import {
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
  acceptedForTest,
  bbcaForTest,
  duringSessionForTest,
  limitForTest,
} from "./orders-for-test";
import { readTicket } from "./read-ticket.server";
import { savePlacedOrder, readPortfolio } from "./portfolio-store.server";
import { studentPortfolioForTest } from "./portfolios-for-test.server";

// Python Decimal at 50 significant digits computed these values independently from the recorded month-end closes. It used sample covariance, a weighted return for each shared month, and ROUND_HALF_UP for the fee and tax. The scripts ran on 15 November 2026 and reproduce the reference source of measure-trade.test.ts.
const cases = [
  {
    code: "BBCA",
    count: 10,
    side: "buy",
    months: 60,
    before: [0.620692927814829, 0.040657150826694, -0.002158672670308],
    after: [0.683456253267589, 0.044981332659041, -0.002251947807209],
    stock: [0.5, 0.5909896804109651],
    cash: 5_968_530,
  },
  {
    code: "AMMN",
    count: 10,
    side: "buy",
    months: 38,
    before: [0.582652157740405, 0.044285839703942, -0.007466708996015],
    after: [0.656721001585072, 0.048100893880116, -0.005586931976559],
    stock: [0, 0.06663681702397237],
    cash: 7_300_525,
  },
  {
    code: "TLKM",
    count: 83,
    side: "sell",
    months: 60,
    before: [0.620692927814829, 0.040657150826694, -0.002158672670308],
    after: [0.344944406104811, 0.026155682979221, -0.000511708073155],
    stock: [0.3, 0],
    cash: 27_348_915,
  },
] as const;

for (const expected of cases) {
  test(`previews the ${expected.side} of ${expected.code} against independent Python Decimal values`, async () => {
    const { ticket, portfolio } = await tradePortfolioForTest(expected.code);
    const input = successValueForTest(
      ticket.impact,
      "Every holding has its quote",
    );
    const day = successValueForTest(ticket.day, "The trading day has rules");
    const request = purchaseForTest({
      code: expected.code,
      lots: orderLotsForTest(expected.count),
      side: expected.side,
    });
    const preview = successValueForTest(
      previewTrade(input, request, { day, quote: ticket.quote }),
      "The accepted order has measures",
    );
    expect(preview.originalMonths?.count).toBe(60);
    const { impact } = preview;
    expect(impact.cashAfter).toBe(expected.cash);
    for (const [position, values] of [
      [impact.before, expected.before],
      [impact.after, expected.after],
    ] as const) {
      expect(position.market.returns).toHaveLength(expected.months);
      expect([
        position.beta.value,
        position.standardDeviation.value,
        position.expectedReturn.value,
      ]).toEqual(values.map((value) => closeToForTest(value, 14)));
    }
    expect(
      impact.before.holdings.find((holding) => holding.code === expected.code)
        ?.weight,
    ).toBeCloseTo(expected.stock[0], 14);
    expect(
      impact.after.holdings.find((holding) => holding.code === expected.code)
        ?.weight,
    ).toBeCloseTo(expected.stock[1], 14);
    expect(sectorWeight(impact.after.holdings, expected.code)).toBeCloseTo(
      expected.stock[1],
      14,
    );
    expect(portfolio.orders).toEqual([]);
  });
}

test("sizes the three portfolio shares with fees, available cash, and the exchange cap", async () => {
  const { ticket } = await tradePortfolioForTest();
  const day = successValueForTest(ticket.day, "The trading day has rules");
  const input = successValueForTest(ticket.impact, "The prices are stored");
  if (ticket.quote === undefined) throw new Error("BBCA has a quote.");
  // Decimal divides each budget by 498000 times 1.0015 and rounds down. The full-budget check still uses the rounded whole-rupiah fee.
  for (const [share, available, count] of [
    [0.05, 10_956_000, 5],
    [0.1, 10_956_000, 10],
    [0.2, 10_956_000, 21],
    [0.2, 1_000_000, 2],
    [0.1, 0, 0],
  ] as const) {
    expect(
      stockImpactLots({
        total: input.total,
        available: rupiah(available),
        share: portfolioWeight(share),
        price: ticket.quote.price,
        day,
      }),
    ).toBe(count);
  }
  expect(
    stockImpactLots({
      total: rupiah(1_000_000_000_000),
      available: rupiah(1_000_000_000_000),
      share: portfolioWeight(0.2),
      price: ticket.quote.price,
      day,
    }),
  ).toBe(day.rules.maximumLots);
});

test("measures cash alone before a first purchase and after a sale of the last holding", async () => {
  for (const [valuation, request, zero] of [
    [cashValuationForTest(), purchaseForTest(), "before"],
    [
      ammnValuationForTest(),
      saleForTest({ code: "AMMN", lots: orderLotsForTest(10) }),
      "after",
    ],
  ] as const) {
    const { ticket } = await tradePortfolioForTest(request.code, valuation);
    const result = successValueForTest(
      previewTrade(
        successValueForTest(ticket.impact, "The prices are stored"),
        request,
        {
          day: successValueForTest(ticket.day, "The rules are stored"),
          quote: ticket.quote,
        },
      ),
      "The trade has measures",
    );
    expect(result.impact[zero].cashWeight).toBe(1);
    expect(result.impact[zero].beta.value).toBe(0);
    expect(result.impact[zero].standardDeviation.value).toBe(0);
    expect(result.impact[zero].expectedReturn.value).toBe(0);
  }
});

test("refuses to invent measures after older closes of a held stock are deleted, even when its sale removes it", async () => {
  const { database, portfolio } = await tradePortfolioForTest();
  deleteStockClosesBeforeForTest(database, "BBCA", "2026-10-26");
  const ticket = readTicket(database, portfolio, {
    code: "BBCA",
    now: duringSessionForTest,
    delayMinutes: bbcaForTest.delayMinutes,
  });
  const input = successValueForTest(
    ticket.impact,
    "The holdings have their quotes",
  );
  const selected = input.stocks.find((stock) => stock.code === "BBCA");
  expect(selected?.closes).toEqual([{ date: "2026-10-30", close: 4980 }]);
  expect(selected?.shares).toBe(5500);
  const result = previewTrade(
    input,
    saleForTest({ lots: orderLotsForTest(55) }),
    {
      day: successValueForTest(ticket.day, "The rules are stored"),
      quote: ticket.quote,
    },
  );
  expect(result).toMatchObject({
    ok: false,
    failure: {
      kind: "measures",
      failure: { kind: "tooFewReturns", code: "BBCA", count: 0, minimum: 24 },
    },
  });
});

test("keeps reserved cash and shares unavailable to a preview and leaves the database unchanged", async () => {
  const { database, portfolio } = await tradePortfolioForTest();
  const owner = await studentPortfolioForTest(database);
  const reservation = acceptedForTest(
    purchaseForTest({ lots: orderLotsForTest(20), reason: "Private reason" }),
    portfolio,
    bbcaForTest,
  );
  const id = savePlacedOrder(database, owner, reservation);
  const ticket = readTicket(
    database,
    { ...portfolio, orders: [{ ...reservation, id }] },
    {
      code: "BBCA",
      now: duringSessionForTest,
      delayMinutes: bbcaForTest.delayMinutes,
    },
  );
  const input = successValueForTest(ticket.impact, "All holdings have quotes");
  expect(input.account.orders).toHaveLength(1);
  expect(input.account.orders[0]?.reason).toBeUndefined();
  expect(ticket.available).toBe(981_060);
  const result = previewTrade(
    input,
    purchaseForTest({ lots: orderLotsForTest(2) }),
    {
      day: successValueForTest(ticket.day, "The day is recorded"),
      quote: ticket.quote,
    },
  );
  expect(result).toMatchObject({
    ok: false,
    failure: {
      kind: "order",
      failure: {
        kind: "notEnoughCash",
        availableCash: 981_060,
        largestLots: 1,
      },
    },
  });
  expect(
    previewTrade(input, purchaseForTest({ price: limitForTest(4_981) }), {
      day: successValueForTest(ticket.day, "The day is recorded"),
      quote: ticket.quote,
    }),
  ).toMatchObject({
    ok: false,
    failure: { kind: "order", failure: { kind: "offTick" } },
  });
  const sale = acceptedForTest(
    saleForTest({ lots: orderLotsForTest(50) }),
    portfolio,
    bbcaForTest,
  );
  const saleTicket = readTicket(
    database,
    { ...portfolio, orders: [{ ...sale, id }] },
    {
      code: "BBCA",
      now: duringSessionForTest,
      delayMinutes: bbcaForTest.delayMinutes,
    },
  );
  expect(saleTicket.free).toBe(5);
  expect(
    previewTrade(
      successValueForTest(saleTicket.impact, "The prices are recorded"),
      saleForTest({ lots: orderLotsForTest(6) }),
      {
        day: successValueForTest(saleTicket.day, "The day is recorded"),
        quote: saleTicket.quote,
      },
    ),
  ).toMatchObject({
    ok: false,
    failure: {
      kind: "order",
      failure: {
        kind: "notEnoughShares",
        heldLots: 55,
        setAside: { amount: 50 },
      },
    },
  });
  expect(readPortfolio(database, owner).orders).toHaveLength(1);
  expect(readPortfolio(database, owner).orders[0]?.state.kind).toBe("waiting");
});
