import { eq } from "drizzle-orm";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { orders, portfolios } from "../app/features/trading/trading.schema.ts";
import type { OrderLots } from "../app/units/lots.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

/** Trades before the fixture quote expose both price comparisons. Python Decimal gives the purchase cost 500 × 4,940 × 1.0015 = 2,473,705 and the net sale gain 2,543,625 - 2,473,705 = 69,920. */
export function storeActivityOrders(classId: ClassId): void {
  writeForTestStudent(classId, (database, membershipId) => {
    database
      .insert(portfolios)
      .values({ membershipId, cash: rupiah(100_000_000) })
      .onConflictDoNothing()
      .run();
    const base = {
      membershipId,
      code: "BBCA",
      side: "buy" as const,
      lots: 5 as OrderLots,
      shares: shares(500),
      placedAt: new Date("2026-10-29T02:30:00Z"),
      tradingDay: "2026-10-29",
      tradesFrom: new Date("2026-10-29T02:00:00Z"),
      expiresAt: new Date("2026-10-29T09:26:00Z"),
      checkedPrice: rupiah(4_980),
      setAsideCash: rupiah(2_493_735),
      reason: "Bank besar dengan laba stabil.\n\nBeta di bawah satu.",
    };
    database
      .insert(orders)
      .values([
        {
          ...base,
          state: "filled",
          endedAt: new Date("2026-10-29T03:00:00Z"),
          quotedAt: new Date("2026-10-29T02:50:00Z"),
          tradePrice: rupiah(4_940),
          tradeValue: rupiah(2_470_000),
          tradeFee: rupiah(3_705),
          tradeTax: rupiah(0),
        },
        {
          ...base,
          side: "sell",
          setAsideCash: rupiah(0),
          state: "filled",
          placedAt: new Date("2026-10-29T03:10:00Z"),
          endedAt: new Date("2026-10-29T03:15:00Z"),
          quotedAt: new Date("2026-10-29T03:05:00Z"),
          tradePrice: rupiah(5_100),
          tradeValue: rupiah(2_550_000),
          tradeFee: rupiah(3_825),
          tradeTax: rupiah(2_550),
          reason: null,
        },
        {
          ...base,
          state: "expired",
          limit: rupiah(4_950),
          endedAt: base.expiresAt,
        },
        {
          ...base,
          state: "cancelled",
          endedAt: new Date("2026-10-29T03:00:00Z"),
        },
        {
          ...base,
          state: "rejected",
          endedAt: new Date("2026-10-29T03:01:00Z"),
          quotedAt: new Date("2026-10-29T02:51:00Z"),
          failure: "priceRose",
          tradePrice: rupiah(5_025),
          tradeValue: rupiah(2_512_500),
          tradeFee: rupiah(3_769),
          tradeTax: rupiah(0),
          availableCash: rupiah(2_500_000),
        },
      ])
      .run();
  });
}

export function widenActivityReasons(classId: ClassId, reason: string): void {
  writeForTestStudent(classId, (database, membershipId) => {
    database
      .update(orders)
      .set({ reason })
      .where(eq(orders.membershipId, membershipId))
      .run();
  });
}
