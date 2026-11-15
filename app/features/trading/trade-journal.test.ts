import { expect, test } from "vitest";
import { stockQuote } from "~/features/market-data/stock-quote";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import {
  activityNowForTest,
  activityOrderForTest,
  filledActivityForTest,
  soldActivityForTest,
} from "./activity-for-test";
import { tradeJournal } from "./trade-journal";
import type { OrderLots } from "~/units/lots";

test("replays fills in execution order and computes the net gain of partial sales with average purchase costs", () => {
  const purchase = filledActivityForTest(2);
  const sale = filledActivityForTest(1, {
    side: "sell",
    lots: 3 as OrderLots,
    shares: shares(300),
    state: {
      kind: "filled",
      fill: {
        price: rupiah(5_100),
        value: rupiah(1_530_000),
        fee: rupiah(2_295),
        tax: rupiah(1_530),
        cashChange: rupiah(1_526_175),
        quotedAt: new Date("2026-11-02T03:00:00Z"),
        filledAt: new Date("2026-11-02T03:10:00Z"),
      },
    },
  });
  const trades = tradeJournal(
    [sale, activityOrderForTest(3), purchase],
    [stockQuote("BBCA", [5_100, 4_980], "2026-11-02T03:00:00Z")],
  );
  // Python Decimal with ROUND_HALF_UP gives the sold cost 2,493,735 × 300 / 500 = 1,496,241, the net gain 1,526,175 - 1,496,241 = 29,934, and the price return 5,100 / 4,980 - 1 = 0.02409638554.
  expect(trades.map((trade) => trade.order.id)).toEqual([1, 2]);
  expect(trades[0]?.realized).toBe(29_934);
  expect(trades[0]?.change).toBe(0);
  expect(trades[1]?.change).toBeCloseTo(0.02409638554);
});

test("withholds performance for missing or older quotes and a sale whose purchases were deleted", () => {
  const purchase = filledActivityForTest(1);
  expect(
    tradeJournal(
      [purchase],
      [stockQuote("BBCA", [4_980, 4_940], "2026-10-30T09:14:55Z")],
    )[0],
  ).toMatchObject({ change: undefined });
  expect(tradeJournal([purchase], [])[0]?.change).toBeUndefined();
  const sale = soldActivityForTest(2);
  expect(tradeJournal([sale], [])[0]?.realized).toBeUndefined();
  expect(
    tradeJournal(
      [
        activityOrderForTest(3, {
          state: { kind: "cancelled", cancelledAt: activityNowForTest },
        }),
      ],
      [],
    ),
  ).toEqual([]);
});

test("keeps sale costs unavailable after missing purchases even when newer trades arrive", () => {
  const missingPurchaseSale = soldActivityForTest(1, {
    filledAt: new Date("2026-11-02T02:55:00Z"),
    quotedAt: new Date("2026-11-02T02:50:00Z"),
  });
  const newerPurchase = filledActivityForTest(2);
  const newerSale = soldActivityForTest(3);
  const trades = tradeJournal(
    [missingPurchaseSale, newerPurchase, newerSale],
    [stockQuote("BBCA", [5_100, 4_980], "2026-11-02T03:00:00Z")],
  );
  expect(trades.map((trade) => trade.order.id)).toEqual([3, 2, 1]);
  expect(trades.map((trade) => trade.realized)).toEqual([
    undefined,
    undefined,
    undefined,
  ]);
});
