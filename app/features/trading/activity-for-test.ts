import type { OrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { StoredOrder } from "./order-rows";
import type { Fill } from "./order";
import {
  acceptedForTest,
  accountForTest,
  bbcaForTest,
  purchaseForTest,
  priceRoseFailureForTest,
} from "./orders-for-test";
import type { OrderId } from "./trading.schema";

export function activityOrderForTest(
  id: number,
  changes: Partial<StoredOrder> = {},
): StoredOrder {
  return {
    ...acceptedForTest(
      { ...purchaseForTest(), ...changes },
      accountForTest({
        holdings: [
          { code: "BBCA", shares: shares(500), cost: rupiah(2_493_735) },
        ],
      }),
      bbcaForTest,
    ),
    id: id as OrderId,
    ...changes,
  };
}

export const activityNowForTest = new Date("2026-11-02T03:00:00Z");

/** The decimal module of Python gives 5 × 100 × 4,980 = 2,490,000 and its 0.15% fee = 3,735. */
export function filledActivityForTest(
  id: number,
  changes: Partial<StoredOrder> = {},
): StoredOrder {
  return activityOrderForTest(id, {
    lots: 5 as OrderLots,
    shares: shares(500),
    state: {
      kind: "filled",
      fill: {
        price: rupiah(4_980),
        value: rupiah(2_490_000),
        fee: rupiah(3_735),
        tax: rupiah(0),
        cashChange: rupiah(-2_493_735),
        quotedAt: new Date("2026-11-02T02:50:00Z"),
        filledAt: activityNowForTest,
      },
    },
    ...changes,
  });
}

/** Python Decimal gives 2,550,000 - 3,825 - 2,550 = 2,543,625 after the sale's fee and tax. */
export function soldActivityForTest(
  id: number,
  fillChanges: Partial<Fill> = {},
): StoredOrder {
  return filledActivityForTest(id, {
    side: "sell",
    state: {
      kind: "filled",
      fill: {
        price: rupiah(5_100),
        value: rupiah(2_550_000),
        fee: rupiah(3_825),
        tax: rupiah(2_550),
        cashChange: rupiah(2_543_625),
        quotedAt: new Date("2026-11-02T03:00:00Z"),
        filledAt: new Date("2026-11-02T03:10:00Z"),
        ...fillChanges,
      },
    },
  });
}

/** The price-rose rejection and its amounts are the independently computed fixture of check-order.test.ts. */
export function rejectedActivityForTest(id: number): StoredOrder {
  return activityOrderForTest(id, {
    state: {
      kind: "rejected",
      rejectedAt: new Date("2026-11-02T03:01:00Z"),
      quotedAt: new Date("2026-11-02T02:51:00Z"),
      failure: priceRoseFailureForTest(),
    },
  });
}
