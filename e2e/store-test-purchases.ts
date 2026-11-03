import { eq } from "drizzle-orm";
import type { ClassId } from "../app/features/classes/classes.schema.ts";
import { memberships } from "../app/features/classes/classes.schema.ts";
import {
  holdings,
  orders,
  portfolios,
} from "../app/features/trading/trading.schema.ts";
import { isOrderLots } from "../app/units/lots.ts";
import type { OrderLots } from "../app/units/lots.ts";
import { rupiah } from "../app/units/rupiah.ts";
import type { Rupiah } from "../app/units/rupiah.ts";
import type { Shares } from "../app/units/shares.ts";
import { writeForTestStudent } from "./write-for-test-student.ts";

/** A market purchase that filled at once on its trading day, as a check of the price job stores it. */
export interface TestPurchase {
  code: string;
  lots: number;
  shares: Shares;
  /** The trading day in WIB, such as 2026-11-02. */
  tradingDay: string;
  placedAt: Date;
  tradesFrom: Date;
  expiresAt: Date;
  /** The delayed price that the order was checked at and filled at, and when it was quoted. */
  price: Rupiah;
  quotedAt: Date;
  value: Rupiah;
  fee: Rupiah;
  /** The value and the fee, which the order set aside until it filled. */
  cost: Rupiah;
}

/**
 * Gives the one student of a class of a test the cash and the holding that purchases of a test leave, with each purchase among the past orders, and moves the time when the student joined the class to a moment of the test, by writing to the database of the test server.
 * A purchase fills at a delayed price of a session of its trading day, which the fixture source never sends, so the test stores the fills that the price job would store, as issue #70 tracks.
 */
export function storeTestPurchases(
  classId: ClassId,
  portfolio: {
    joinedAt: Date;
    /** The cash and the holding that the purchases leave. */
    cash: Rupiah;
    holding: { code: string; shares: Shares; cost: Rupiah };
    purchases: readonly TestPurchase[];
  },
): void {
  writeForTestStudent(classId, (database, membershipId) => {
    database
      .update(memberships)
      .set({ joinedAt: portfolio.joinedAt })
      .where(eq(memberships.id, membershipId))
      .run();
    database
      .insert(portfolios)
      .values({ membershipId, cash: portfolio.cash })
      .run();
    for (const purchase of portfolio.purchases) {
      database
        .insert(orders)
        .values({
          membershipId,
          code: purchase.code,
          side: "buy",
          lots: orderLotsOf(purchase.lots),
          limit: null,
          placedAt: purchase.placedAt,
          shares: purchase.shares,
          tradingDay: purchase.tradingDay,
          tradesFrom: purchase.tradesFrom,
          expiresAt: purchase.expiresAt,
          checkedPrice: purchase.price,
          setAsideCash: purchase.cost,
          state: "filled",
          endedAt: purchase.quotedAt,
          quotedAt: purchase.quotedAt,
          tradePrice: purchase.price,
          tradeValue: purchase.value,
          tradeFee: purchase.fee,
          tradeTax: rupiah(0),
        })
        .run();
    }
    database
      .insert(holdings)
      .values({ membershipId, ...portfolio.holding })
      .run();
  });
}

function orderLotsOf(count: number): OrderLots {
  if (!isOrderLots(count)) {
    throw new Error(`A test purchase has ${String(count)} lots.`);
  }
  return count;
}
