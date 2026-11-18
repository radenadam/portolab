import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { startingCashLimits } from "../app/features/classes/class-rules.ts";
import { idxOrderSize } from "../app/features/trading/idx-order-size.ts";
import { orders } from "../app/features/trading/trading.schema.ts";
import { isOrderLots } from "../app/units/lots.ts";
import { rupiah } from "../app/units/rupiah.ts";
import { shares } from "../app/units/shares.ts";
import { storeTestPortfolio } from "./store-test-portfolio.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";
import { storeTestJoiningTime } from "./store-test-joining-time.ts";

export function storeWideHomeOrder(classId: ClassId): void {
  const count = idxOrderSize.maximumLots;
  if (!isOrderLots(count))
    throw new Error("The IDX maximum is not an order size.");
  writeForTestStudent(classId, (database, membershipId) => {
    storeTestJoiningTime(
      database,
      membershipId,
      new Date("2026-10-29T02:00:00Z"),
    );
    const portfolioId = storeTestPortfolio(
      database,
      { membershipId },
      startingCashLimits.maximum,
    );
    database
      .insert(orders)
      .values({
        portfolioId,
        code: "BBCA",
        side: "buy",
        lots: count,
        shares: shares(count * idxOrderSize.lotShares),
        checkedPrice: rupiah(4_940),
        // System.Decimal gives 50,000 × 100 × 4,940 × 1.0015 = 24,737,050,000 at the recorded close of 29 October, which the largest starting cash pays for.
        setAsideCash: rupiah(24_737_050_000),
        placedAt: new Date("2026-10-29T02:30:00Z"),
        tradingDay: "2026-10-29",
        tradesFrom: new Date("2026-10-29T02:00:00Z"),
        expiresAt: new Date("2026-10-29T09:26:00Z"),
        state: "expired",
        endedAt: new Date("2026-10-29T09:26:00Z"),
      })
      .run();
  });
}
