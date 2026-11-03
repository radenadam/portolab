import { expect, test } from "vitest";
import { stockQuote } from "~/features/market-data/stock-quote";
import {
  indexHistoryForTest,
  stockClosesForTest,
  stockHistoryForTest,
  withClosesForTest,
} from "~/features/market-data/history-for-test";
import type { StockHistory } from "~/features/market-data/price-source.server";
import { marketWithoutCompleteMonthForTest } from "~/features/measures/market-without-complete-month-for-test";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { OpenOrder, OrderRequest } from "./order";
import {
  acceptedForTest,
  accountForTest,
  bbcaForTest,
  duringSessionForTest,
  endOfMondayForTest,
  lastMinuteOfMondayForTest,
  limitForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "./orders-for-test";
import { placeOrder } from "./place-order";
import type { AccountState, StockState } from "./place-order";
import { rateLimit } from "./price-limits";

// The money in the expected orders and failures was computed with the decimal module of Python, with a broker fee of 0.15% of the value rounded to a whole rupiah with ROUND_HALF_UP. The limits of prices come from the same computation as in accepted-prices.test.ts. The comment of each moment gives the time in WIB.

const ihsg = bbcaForTest.marketCloses;

// BBCA has the 60 monthly returns of the window, and its stored close of Friday 30 October 2026 is Rp4,980. AADI listed in December 2024, so it has 21 of the 24 returns that the measures need.
const bbcaCloses = bbcaForTest.closes;
const aadiCloses = stockHistoryForTest(monthEndClosesForTest("AADI"));
const bbca = bbcaForTest;
const duringSession = duringSessionForTest;
const purchase = purchaseForTest;
const sale = saleForTest;
const account = accountForTest;

function accepted(
  request: OrderRequest,
  state: AccountState = account(),
): OpenOrder {
  return acceptedForTest(request, state, bbca);
}

/** BBCA at 10:00 on Tuesday 3 November 2026, once the update of the price history has stored the closes of Monday 2 November, with the closes of BBCA before Monday that a test gives. */
function bbcaOfTuesday(closesBeforeMonday: StockHistory): StockState {
  return {
    ...bbca,
    quote: stockQuote("BBCA", [4_980, 4_980], "2026-11-03T02:50:00Z"),
    closes: stockHistoryForTest(
      withClosesForTest(closesBeforeMonday, [["2026-11-02", 4_980]]),
    ),
    marketCloses: indexHistoryForTest(
      withClosesForTest(ihsg, [["2026-11-02", 5_100]]),
    ),
  };
}

test("accepts a market purchase of a stock with the monthly returns that the measures need, and sets aside its value and fee at the latest delayed price", () => {
  expect(placeOrder(purchase(), account(), bbca)).toEqual({
    ok: true,
    value: {
      code: "BBCA",
      side: "buy",
      lots: 5,
      price: { kind: "market" },
      placedAt: duringSession,
      shares: 500,
      tradingDay: "2026-11-02",
      // 09:00.
      tradesFrom: new Date("2026-11-02T02:00:00.000Z"),
      // 16:26, when the prices of the day are final for this delay.
      expiresAt: new Date("2026-11-02T09:26:00.000Z"),
      checkedPrice: 4_980,
      setAsideCash: 2_493_735,
      state: { kind: "waiting" },
    },
  });
});

test("accepts a limit purchase in the evening for the next trading day, against the limits of the stored close of the day", () => {
  // At 20:00, Monday has closed at Rp5,000, which is the reference price of Tuesday. Its highest price is Rp6,250, while the previous close of Rp4,980 that the quotes of Monday state allows only Rp6,225 on Monday.
  const request = purchase({
    lots: orderLotsForTest(1),
    price: limitForTest(6_250),
    placedAt: new Date("2026-11-02T13:00:00Z"),
  });
  const closedMonday: StockState = {
    ...bbca,
    quote: stockQuote("BBCA", [5_000, 4_980], "2026-11-02T09:14:55Z"),
    closes: stockHistoryForTest(
      withClosesForTest(bbcaCloses, [["2026-11-02", 5_000]]),
    ),
  };
  expect(placeOrder(request, account(), closedMonday)).toEqual({
    ok: true,
    value: {
      ...request,
      shares: 100,
      tradingDay: "2026-11-03",
      tradesFrom: new Date("2026-11-03T02:00:00.000Z"),
      expiresAt: new Date("2026-11-03T09:26:00.000Z"),
      checkedPrice: 6_250,
      setAsideCash: 625_938,
      state: { kind: "waiting" },
    },
  });
  expect(
    placeOrder({ ...request, placedAt: duringSession }, account(), bbca),
  ).toMatchObject({
    ok: false,
    failure: { kind: "outsideLimits", reference: 4_980, highest: 6_225 },
  });
});

test("rejects a limit order for the next trading day until the close of the day is stored, and accepts it once the close is stored after the prices are final", () => {
  const limitOrder = purchase({ price: limitForTest(5_000) });
  // At 16:25, after session II, the order trades on Tuesday, and the close of Monday is not final before 16:26.
  expect(
    placeOrder(
      { ...limitOrder, placedAt: new Date("2026-11-02T09:25:00Z") },
      account(),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "noReferenceClose", code: "BBCA", date: "2026-11-02" },
  });
  // At 16:26, once the next update of the price history has stored the close of Monday.
  expect(
    placeOrder(
      { ...limitOrder, placedAt: new Date("2026-11-02T09:26:00Z") },
      account(),
      {
        ...bbca,
        closes: stockHistoryForTest(
          withClosesForTest(bbcaCloses, [["2026-11-02", 4_980]]),
        ),
      },
    ),
  ).toMatchObject({ ok: true, value: { tradingDay: "2026-11-03" } });
});

test("accepts a sale of shares that no other order sets aside, which sets aside no cash", () => {
  const holdings = [{ code: "BBCA", shares: shares(1_000), cost: rupiah(0) }];
  const earlierSale = accepted(
    sale({ lots: orderLotsForTest(3) }),
    account({ holdings }),
  );
  expect(
    placeOrder(sale(), account({ holdings, orders: [earlierSale] }), bbca),
  ).toMatchObject({
    ok: true,
    value: { side: "sell", setAsideCash: 0, state: { kind: "waiting" } },
  });
});

test("accepts a sale of a stock outside the universe, which a holding keeps from an earlier period", () => {
  // BREN stands for a stock that a later review of the LQ45 removes after the account bought it. Portolab keeps tracking the stocks of every recorded period, so such a stock has a quote.
  expect(
    placeOrder(
      sale({ code: "BREN" }),
      account({
        holdings: [{ code: "BREN", shares: shares(500), cost: rupiah(0) }],
      }),
      {
        ...bbca,
        quote: stockQuote("BREN", [7_250, 7_200], "2026-11-02T02:50:00Z"),
        closes: stockClosesForTest("BREN", [["2026-10-30", 7_200]]),
      },
    ),
  ).toMatchObject({
    ok: true,
    value: { code: "BREN", side: "sell", state: { kind: "waiting" } },
  });
});

test("rejects a purchase of a stock outside the universe of its trading day, for which Portolab has no quote, because it tracks only the stocks of the universe", () => {
  expect(
    placeOrder(purchase({ code: "BREN" }), account(), {
      ...bbca,
      quote: undefined,
    }),
  ).toEqual({
    ok: false,
    failure: { kind: "outsideUniverse", code: "BREN", date: "2026-11-02" },
  });
});

test("rejects a purchase of a stock with fewer monthly returns than the measures need, and gives the month whose first trading day brings enough", () => {
  expect(
    placeOrder(purchase({ code: "AADI" }), account(), {
      ...bbca,
      quote: stockQuote("AADI", [11_475, 11_475], "2026-11-02T02:50:00Z"),
      closes: aadiCloses,
    }),
  ).toEqual({
    ok: false,
    failure: {
      kind: "tooFewReturns",
      code: "AADI",
      count: 21,
      minimum: 24,
      enoughAfterFirstTradingDayOf: "2027-01-01",
    },
  });
});

test("accepts a purchase of a stock once the update of the price history stores the close of the first trading day of the month that the rejection names, and not before", () => {
  // The closes of the latest 25 month ends give 23 returns in the window that ends in September 2026, so the return of October 2026 is the one missing.
  const shortHistory: StockHistory = {
    kind: "stock",
    code: "BBCA",
    closes: bbcaCloses.closes.slice(-25),
  };
  expect(
    placeOrder(purchase(), account(), { ...bbca, closes: shortHistory }),
  ).toEqual({
    ok: false,
    failure: {
      kind: "tooFewReturns",
      code: "BBCA",
      count: 23,
      minimum: 24,
      enoughAfterFirstTradingDayOf: "2026-11-01",
    },
  });
  // At 16:30 on Monday, after the close of the first trading day of November but before the update stores it.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-11-02T09:30:00Z") }),
      account(),
      { ...bbca, closes: shortHistory },
    ),
  ).toMatchObject({ ok: false, failure: { kind: "tooFewReturns", count: 23 } });
  // 10:00 on Tuesday 3 November 2026, once the update has stored the closes of Monday 2 November.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-11-03T03:00:00Z") }),
      account(),
      bbcaOfTuesday(shortHistory),
    ),
  ).toMatchObject({ ok: true, value: { tradingDay: "2026-11-03" } });
});

test("names the month that brings enough returns to a stock whose window loses an old return as each new month enters it, and accepts the purchase once the close of the first trading day of that month is stored, and not before", () => {
  // BBCA keeps only its closes of September and October 2021 and its closes from November 2024. In the window that ends in September 2026, they give the return of October 2021 and the 22 returns from December 2024, which are 23. The window that ends in October 2026 gains the return of October 2026 but loses the return of October 2021, so the return of November 2026 is the one that brings 24.
  const gapHistory: StockHistory = {
    ...bbcaCloses,
    closes: bbcaCloses.closes.filter(
      (close) =>
        (close.date >= "2021-09-01" && close.date < "2021-11-01") ||
        close.date >= "2024-11-01",
    ),
  };
  const rejection = {
    ok: false,
    failure: {
      kind: "tooFewReturns",
      code: "BBCA",
      count: 23,
      minimum: 24,
      enoughAfterFirstTradingDayOf: "2026-12-01",
    },
  };
  expect(
    placeOrder(purchase(), account(), { ...bbca, closes: gapHistory }),
  ).toEqual(rejection);
  // 10:00 on Tuesday 3 November 2026, once the update has stored the closes of Monday 2 November, which complete October.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-11-03T03:00:00Z") }),
      account(),
      bbcaOfTuesday(gapHistory),
    ),
  ).toEqual(rejection);
  const closesUntilNovember: [string, number][] = [
    ["2026-11-02", 4_980],
    ["2026-11-30", 5_000],
  ];
  const levelsUntilNovember: [string, number][] = [
    ["2026-11-02", 5_100],
    ["2026-11-30", 5_150],
  ];
  // At 16:30 on Tuesday 1 December 2026, after the close of the first trading day of December but before the update stores it.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-12-01T09:30:00Z") }),
      account(),
      {
        ...bbca,
        quote: stockQuote("BBCA", [5_000, 5_000], "2026-12-01T09:14:55Z"),
        closes: stockHistoryForTest(
          withClosesForTest(gapHistory, closesUntilNovember),
        ),
        marketCloses: indexHistoryForTest(
          withClosesForTest(ihsg, levelsUntilNovember),
        ),
      },
    ),
  ).toEqual(rejection);
  // 10:00 on Wednesday 2 December 2026, once the update has stored the closes of Tuesday 1 December.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-12-02T03:00:00Z") }),
      account(),
      {
        ...bbca,
        quote: stockQuote("BBCA", [5_000, 5_000], "2026-12-02T02:50:00Z"),
        closes: stockHistoryForTest(
          withClosesForTest(gapHistory, [
            ...closesUntilNovember,
            ["2026-12-01", 5_000],
          ]),
        ),
        marketCloses: indexHistoryForTest(
          withClosesForTest(ihsg, [
            ...levelsUntilNovember,
            ["2026-12-01", 5_160],
          ]),
        ),
      },
    ),
  ).toMatchObject({ ok: true, value: { tradingDay: "2026-12-02" } });
});

test("rejects a purchase while the market has no complete month of stored closes", () => {
  expect(
    placeOrder(purchase(), account(), {
      ...bbca,
      marketCloses: marketWithoutCompleteMonthForTest(),
    }),
  ).toEqual({
    ok: false,
    failure: { kind: "noPriceHistory", code: "BBCA", instrument: "IHSG" },
  });
});

test("rejects a purchase of a stock without stored closes, instead of counting its returns as none", () => {
  expect(
    placeOrder(purchase(), account(), {
      ...bbca,
      closes: { kind: "stock", code: "BBCA", closes: [] },
    }),
  ).toEqual({
    ok: false,
    failure: { kind: "noPriceHistory", code: "BBCA", instrument: "BBCA" },
  });
});

test("rejects an order for a stock that has no delayed price yet", () => {
  expect(
    placeOrder(purchase(), account(), { ...bbca, quote: undefined }),
  ).toEqual({ ok: false, failure: { kind: "noPrice", code: "BBCA" } });
});

test("accepts an order of the largest number of lots that IDX accepts in one order", () => {
  // 50,000 lots at Rp4,980 cost Rp24,900,000,000 with a fee of Rp37,350,000, which is Rp24,937,350,000.
  const state = account({ cash: rupiah(24_937_350_000) });
  expect(
    placeOrder(purchase({ lots: orderLotsForTest(50_000) }), state, bbca),
  ).toMatchObject({ ok: true, value: { setAsideCash: 24_937_350_000 } });
});

test("rejects a limit price beyond the auto rejection limits of the reference price", () => {
  expect(
    placeOrder(purchase({ price: limitForTest(6_250) }), account(), bbca),
  ).toEqual({
    ok: false,
    failure: {
      kind: "outsideLimits",
      code: "BBCA",
      date: "2026-11-02",
      price: 6_250,
      reference: 4_980,
      lowest: 4_640,
      highest: 6_225,
      upper: rateLimit(2_500),
      lower: rateLimit(700),
    },
  });
});

test("rejects a limit price between two steps of its band", () => {
  expect(
    placeOrder(purchase({ price: limitForTest(4_985) }), account(), bbca),
  ).toEqual({
    ok: false,
    failure: {
      kind: "offTick",
      price: 4_985,
      tick: 10,
      bandFrom: 2_000,
      nextBandFrom: 5_000,
      below: 4_980,
      above: 4_990,
    },
  });
});

test("rejects a purchase that costs more than the cash that other open orders leave, and accepts the largest order that the failure names", () => {
  // The waiting purchase of 1 lot at Rp4,980 sets aside Rp498,747 of the cash of Rp2,500,000. The 4 lots that the failure names cost Rp1,994,988 of the Rp2,001,253 that it leaves.
  const earlierPurchase = accepted(purchase({ lots: orderLotsForTest(1) }));
  const state = account({
    cash: rupiah(2_500_000),
    orders: [earlierPurchase],
  });
  expect(placeOrder(purchase(), state, bbca)).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughCash",
      code: "BBCA",
      lots: 5,
      price: 4_980,
      value: 2_490_000,
      fee: 3_735,
      tax: 0,
      cash: 2_500_000,
      setAside: { amount: 498_747, orders: 1 },
      holdsFreeShares: false,
      sales: { codes: [], orders: 0 },
      availableCash: 2_001_253,
      largestLots: 4,
      highestLotPrice: 19_982,
      minimumPrice: 1,
    },
  });
  expect(
    placeOrder(purchase({ lots: orderLotsForTest(4) }), state, bbca),
  ).toMatchObject({ ok: true, value: { setAsideCash: 1_994_988 } });
});

const lastMinuteOfMonday = lastMinuteOfMondayForTest;
const endOfMonday = endOfMondayForTest;

test("rejects a purchase while an open buy order of the day sets aside the cash, and accepts it once that order expires", () => {
  // The limit purchase of Monday at Rp4,950 stays open below the price of Rp4,980, and it sets aside Rp2,478,713 of the cash of Rp2,500,000 until 16:26, even before a check marks it expired.
  const state = account({
    cash: rupiah(2_500_000),
    orders: [accepted(purchase({ price: limitForTest(4_950) }))],
  });
  expect(
    placeOrder(purchase({ placedAt: lastMinuteOfMonday }), state, bbca),
  ).toMatchObject({
    ok: false,
    failure: {
      kind: "notEnoughCash",
      setAside: { amount: 2_478_713, orders: 1 },
    },
  });
  expect(
    placeOrder(purchase({ placedAt: endOfMonday }), state, bbca),
  ).toMatchObject({ ok: true, value: { setAsideCash: 2_493_735 } });
});

test("accepts a limit purchase of 1 lot at a valid price up to the highest price that the rejection names, and rejects one above it", () => {
  // The cash of Rp497,000 does not pay for 1 lot at Rp4,980, which costs Rp498,747. It pays for 1 lot up to a price of Rp4,962, because 1 lot costs Rp496,944 at Rp4,962 and Rp497,044 at Rp4,963. A limit of Rp4,960 costs Rp496,744, and a limit of Rp4,970 costs Rp497,746.
  const state = account({ cash: rupiah(497_000) });
  const oneLot = { lots: orderLotsForTest(1) };
  expect(placeOrder(purchase(oneLot), state, bbca)).toMatchObject({
    ok: false,
    failure: { kind: "notEnoughCash", largestLots: 0, highestLotPrice: 4_962 },
  });
  expect(
    placeOrder(
      purchase({ ...oneLot, price: limitForTest(4_960) }),
      state,
      bbca,
    ),
  ).toMatchObject({ ok: true, value: { setAsideCash: 496_744 } });
  expect(
    placeOrder(
      purchase({ ...oneLot, price: limitForTest(4_970) }),
      state,
      bbca,
    ),
  ).toMatchObject({ ok: false, failure: { kind: "notEnoughCash" } });
});

test("gives the minimum price of IDX when the cash does not pay for 1 lot at any price", () => {
  // 1 lot at Rp1 costs Rp100, because its fee of Rp0.15 rounds to nothing.
  expect(
    placeOrder(
      purchase({ lots: orderLotsForTest(1) }),
      account({ cash: rupiah(99) }),
      bbca,
    ),
  ).toMatchObject({
    ok: false,
    failure: { kind: "notEnoughCash", highestLotPrice: 0, minimumPrice: 1 },
  });
});

test("offers no sale for cash when open sell orders set aside every share that the account holds", () => {
  // The cash of Rp400,000 does not pay for 1 lot at Rp4,980, and the only holding of 5 lots is in an open sell order.
  const holdings = [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }];
  const state = account({
    cash: rupiah(400_000),
    holdings,
    orders: [accepted(sale(), account({ holdings }))],
  });
  expect(
    placeOrder(purchase({ lots: orderLotsForTest(1) }), state, bbca),
  ).toMatchObject({
    ok: false,
    failure: {
      kind: "notEnoughCash",
      largestLots: 0,
      holdsFreeShares: false,
      sales: { codes: ["BBCA"], orders: 1 },
    },
  });
  expect(
    placeOrder(
      purchase({ lots: orderLotsForTest(1) }),
      { ...state, orders: [] },
      bbca,
    ),
  ).toMatchObject({
    ok: false,
    failure: { kind: "notEnoughCash", holdsFreeShares: true },
  });
});

test("rejects a sale while an open sell order of the day sets aside the shares, and accepts it once that order expires", () => {
  // The limit sale of Monday at Rp5,050 stays open above the price of Rp4,980 until 16:26.
  const holdings = [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }];
  const state = account({
    holdings,
    orders: [
      accepted(sale({ price: limitForTest(5_050) }), account({ holdings })),
    ],
  });
  expect(
    placeOrder(sale({ placedAt: lastMinuteOfMonday }), state, bbca),
  ).toMatchObject({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      heldLots: 5,
      setAside: { amount: 5, orders: 1 },
    },
  });
  expect(
    placeOrder(sale({ placedAt: endOfMonday }), state, bbca),
  ).toMatchObject({ ok: true, value: { side: "sell" } });
});

test("rejects a sale of more lots than the holding has beyond other open sell orders, and accepts the largest sale that the failure names", () => {
  const holdings = [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }];
  const earlierSale = accepted(
    sale({ lots: orderLotsForTest(3) }),
    account({ holdings }),
  );
  const state = account({ holdings, orders: [earlierSale] });
  expect(placeOrder(sale({ lots: orderLotsForTest(3) }), state, bbca)).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      code: "BBCA",
      lots: 3,
      heldLots: 5,
      setAside: { amount: 3, orders: 1 },
    },
  });
  expect(
    placeOrder(sale({ lots: orderLotsForTest(2) }), state, bbca),
  ).toMatchObject({ ok: true, value: { side: "sell", lots: 2 } });
});

test("rejects a sale of a stock that the account does not hold", () => {
  expect(placeOrder(sale(), account(), bbca)).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      code: "BBCA",
      lots: 5,
      heldLots: 0,
      setAside: { amount: 0, orders: 0 },
    },
  });
});

test("rejects a sale of a stock that Portolab does not track and the account does not hold as a sale without shares, before it asks for a quote", () => {
  expect(
    placeOrder(sale({ code: "BREN" }), account(), {
      ...bbca,
      quote: undefined,
    }),
  ).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      code: "BREN",
      lots: 5,
      heldLots: 0,
      setAside: { amount: 0, orders: 0 },
    },
  });
});

test("rejects an order for a trading day that some rule has no record for, with the reason for the log", () => {
  // At 16:00 on Wednesday 30 December 2026 the next trading day is Monday 4 January 2027.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-12-30T09:00:00Z") }),
      account(),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: {
      kind: "missingRules",
      reason:
        "No recorded IDX rule for the auto rejection limits covers 2027-01-04, so add the rules that IDX set for that day to idx-rules-on.ts.",
    },
  });
});

test("rejects an order for a trading day that the costs have no record for, with the reason for the log", () => {
  // 10:00 on Friday 30 October 2026, before the first recorded fee schedule.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-10-30T03:00:00Z") }),
      account(),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: {
      kind: "missingCosts",
      reason:
        "No record of the broker fee covers 2026-10-30, so add the rates for that day to trading-costs.ts.",
    },
  });
});

test("rejects an order for a trading day that both some rule and the costs have no record for as missing rules, and names both in the reason for the log", () => {
  // 10:00 on Tuesday 1 September 2026, before the minimum price and the limits of September 2026.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-09-01T03:00:00Z") }),
      account(),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: {
      kind: "missingRules",
      reason:
        "No recorded IDX rule for the minimum price and the auto rejection limits covers 2026-09-01, so add the rules that IDX set for that day to idx-rules-on.ts. No record of the broker fee covers 2026-09-01, so add the rates for that day to trading-costs.ts.",
    },
  });
});

test("rejects an order when the search for its trading day reaches a date that no calendar covers, with the reason for the log", () => {
  // 16:00 on Thursday 30 December 2027, and 31 December 2027 is a holiday.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2027-12-30T09:00:00Z") }),
      account(),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: {
      kind: "missingRules",
      reason:
        "No IDX trading calendar covers 2028-01-01, so add the holidays and trading hours of that year to idx-calendar.ts.",
    },
  });
});
