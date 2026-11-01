import { expect, test } from "vitest";
import type { InstrumentCloses } from "~/features/measures/aligned-returns";
import { marketWithoutCompleteMonthForTest } from "~/features/measures/market-without-complete-month-for-test";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import type { OpenOrder, OrderRequest } from "./order";
import {
  acceptedForTest,
  limitForTest,
  orderLotsForTest,
  quoteForTest,
} from "./orders-for-test";
import { placeOrder } from "./place-order";
import type { AccountState, StockState } from "./place-order";
import { rateLimit } from "./price-limits";

// The money in the expected orders and failures was computed with the decimal module of Python, with a broker fee of 0.15% of the value rounded to a whole rupiah with ROUND_HALF_UP. The limits of prices come from the same computation as in accepted-prices.test.ts. The comment of each moment gives the time in WIB.

const ihsg = monthEndClosesForTest("IHSG");

// BBCA has the 60 monthly returns of the window, and its stored close of Friday 30 October 2026 is Rp4,980. AADI listed in December 2024, so it has 21 of the 24 returns that the measures need.
const bbcaCloses = monthEndClosesForTest("BBCA");
const aadiCloses = monthEndClosesForTest("AADI");

// 10:00 on Monday 2 November 2026, in session I.
const duringSession = new Date("2026-11-02T03:00:00Z");

// The latest delayed quote at 10:00, quoted at 09:50, from a source that lags 10 minutes behind the exchange.
const bbca: StockState = {
  quote: quoteForTest("BBCA", 4_980, "2026-11-02T02:50:00Z"),
  delayMinutes: 10,
  closes: bbcaCloses,
  marketCloses: ihsg,
};

function purchase(changes: Partial<OrderRequest> = {}): OrderRequest {
  return {
    code: "BBCA",
    side: "buy",
    lots: orderLotsForTest(5),
    price: { kind: "market" },
    placedAt: duringSession,
    ...changes,
  };
}

function sale(changes: Partial<OrderRequest> = {}): OrderRequest {
  return purchase({ side: "sell", ...changes });
}

function account(changes: Partial<AccountState> = {}): AccountState {
  return { cash: rupiah(100_000_000), holdings: [], orders: [], ...changes };
}

function accepted(
  request: OrderRequest,
  state: AccountState = account(),
): OpenOrder {
  return acceptedForTest(request, state, bbca);
}

/** Closes with an added close of Monday 2 November 2026. */
function withCloseOfMonday(
  history: InstrumentCloses,
  close: number,
): InstrumentCloses {
  return {
    code: history.code,
    closes: [
      ...history.closes,
      { date: "2026-11-02", close: splitAdjustedRupiah(close) },
    ],
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
  // At 20:00, Monday has closed at Rp5,000, which is the reference price of Tuesday. Its highest price is Rp6,250, while the close of Friday allows only Rp6,225 on Monday.
  const request = purchase({
    lots: orderLotsForTest(1),
    price: limitForTest(6_250),
    placedAt: new Date("2026-11-02T13:00:00Z"),
  });
  const closedMonday: StockState = {
    ...bbca,
    quote: quoteForTest("BBCA", 5_000, "2026-11-02T09:14:55Z"),
    closes: withCloseOfMonday(bbcaCloses, 5_000),
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
      { ...bbca, closes: withCloseOfMonday(bbcaCloses, 4_980) },
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
  expect(
    placeOrder(
      sale({ code: "BREN" }),
      account({
        holdings: [{ code: "BREN", shares: shares(500), cost: rupiah(0) }],
      }),
      {
        ...bbca,
        quote: quoteForTest("BREN", 4_980, "2026-11-02T02:50:00Z"),
        closes: aadiCloses,
      },
    ),
  ).toMatchObject({
    ok: true,
    value: { code: "BREN", side: "sell", state: { kind: "waiting" } },
  });
});

test("rejects a purchase of a stock outside the universe of its trading day", () => {
  expect(
    placeOrder(purchase({ code: "BREN" }), account(), {
      ...bbca,
      quote: quoteForTest("BREN", 4_980, "2026-11-02T02:50:00Z"),
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
      quote: quoteForTest("AADI", 4_980, "2026-11-02T02:50:00Z"),
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

test("accepts a purchase of a stock once the first trading day of the month that the rejection names has closed, and not during that day", () => {
  // The closes of the latest 25 month ends give 23 returns in the window that ends in September 2026, so the return of October 2026 is the one missing.
  const shortHistory: InstrumentCloses = {
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
  // 10:00 on Tuesday 3 November 2026, once the closes of Monday 2 November, the first trading day of November, are stored.
  expect(
    placeOrder(
      purchase({ placedAt: new Date("2026-11-03T03:00:00Z") }),
      account(),
      {
        ...bbca,
        quote: quoteForTest("BBCA", 4_980, "2026-11-03T02:50:00Z"),
        closes: withCloseOfMonday(shortHistory, 4_980),
        marketCloses: withCloseOfMonday(ihsg, 5_100),
      },
    ),
  ).toMatchObject({ ok: true, value: { tradingDay: "2026-11-03" } });
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
      closes: { code: "BBCA", closes: [] },
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

test("rejects an order of more lots than IDX accepts in one order", () => {
  expect(
    placeOrder(purchase({ lots: orderLotsForTest(50_001) }), account(), bbca),
  ).toEqual({
    ok: false,
    failure: { kind: "tooManyLots", lots: 50_001, maximumLots: 50_000 },
  });
});

test("rejects a limit price beyond the auto rejection limits of the stored close of the previous trading day", () => {
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
      code: "BBCA",
      date: "2026-11-02",
      price: 4_985,
      tick: 10,
      bandFrom: 2_000,
      nextBandFrom: 5_000,
      below: 4_980,
      above: 4_990,
    },
  });
});

test("rejects a purchase that costs more than the cash that other open orders leave, and gives the largest that it pays for", () => {
  // The waiting purchase of 1 lot at Rp4,980 sets aside Rp498,747 of the cash of Rp2,500,000.
  const earlierPurchase = accepted(purchase({ lots: orderLotsForTest(1) }));
  expect(
    placeOrder(
      purchase(),
      account({ cash: rupiah(2_500_000), orders: [earlierPurchase] }),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughCash",
      code: "BBCA",
      lots: 5,
      price: 4_980,
      value: 2_490_000,
      fee: 3_735,
      cash: 2_500_000,
      setAsideCash: 498_747,
      holdsFreeShares: false,
      sellingCodes: [],
      availableCash: 2_001_253,
      largestLots: 4,
    },
  });
});

// 16:25, the last minute before the prices of Monday are final, and 16:26, when the open orders of Monday expire.
const lastMinuteOfMonday = new Date("2026-11-02T09:25:00Z");
const endOfMonday = new Date("2026-11-02T09:26:00Z");

test("rejects a purchase while an open buy order of the day sets aside the cash, and accepts it once that order expires", () => {
  // The purchase of Monday sets aside Rp2,493,735 of the cash of Rp2,500,000 until 16:26, even before a check marks it expired.
  const state = account({
    cash: rupiah(2_500_000),
    orders: [accepted(purchase())],
  });
  expect(
    placeOrder(purchase({ placedAt: lastMinuteOfMonday }), state, bbca),
  ).toMatchObject({
    ok: false,
    failure: { kind: "notEnoughCash", setAsideCash: 2_493_735 },
  });
  expect(
    placeOrder(purchase({ placedAt: endOfMonday }), state, bbca),
  ).toMatchObject({ ok: true, value: { setAsideCash: 2_493_735 } });
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
      sellingCodes: ["BBCA"],
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
  const holdings = [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }];
  const state = account({
    holdings,
    orders: [accepted(sale(), account({ holdings }))],
  });
  expect(
    placeOrder(sale({ placedAt: lastMinuteOfMonday }), state, bbca),
  ).toMatchObject({
    ok: false,
    failure: { kind: "notEnoughShares", heldLots: 5, setAsideLots: 5 },
  });
  expect(
    placeOrder(sale({ placedAt: endOfMonday }), state, bbca),
  ).toMatchObject({ ok: true, value: { side: "sell" } });
});

test("rejects a sale of more lots than the holding has beyond other open sell orders", () => {
  const holdings = [{ code: "BBCA", shares: shares(500), cost: rupiah(0) }];
  const earlierSale = accepted(
    sale({ lots: orderLotsForTest(3) }),
    account({ holdings }),
  );
  expect(
    placeOrder(
      sale({ lots: orderLotsForTest(3) }),
      account({ holdings, orders: [earlierSale] }),
      bbca,
    ),
  ).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      code: "BBCA",
      lots: 3,
      heldLots: 5,
      setAsideLots: 3,
    },
  });
});

test("rejects a sale of a stock that the account does not hold", () => {
  expect(placeOrder(sale(), account(), bbca)).toEqual({
    ok: false,
    failure: {
      kind: "notEnoughShares",
      code: "BBCA",
      lots: 5,
      heldLots: 0,
      setAsideLots: 0,
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
