import { and, asc, eq, inArray } from "drizzle-orm";
import type { DatabaseWriter } from "~/database/database.server";
import type { MembershipId } from "~/features/classes/classes.schema";
import type { Rupiah } from "~/units/rupiah";
import type { Holding } from "./holding-after-fill";
import type { OpenOrder, OrderState } from "./order";
import { limitOf, stateColumns, storedOrderOf } from "./order-rows";
import type { StoredOrder } from "./order-rows";
import { isOpenStateKind } from "./open-orders";
import { holdings, orderStates, orders, portfolios } from "./trading.schema";
import type { OrderId } from "./trading.schema";

/** What a portfolio holds: its cash, its holdings by code, and its orders in the order in which the student placed them. */
export interface Portfolio {
  cash: Rupiah;
  holdings: Holding[];
  orders: StoredOrder[];
}

/** The portfolio of a student in a class, which holds the starting cash of the class and nothing else until the first order stores it. */
export interface PortfolioOwner {
  membershipId: MembershipId;
  startingCash: Rupiah;
}

/** Reads the portfolio of an owner, which is the starting cash of the class and nothing else before the first order. */
export function readPortfolio(
  database: DatabaseWriter,
  owner: PortfolioOwner,
): Portfolio {
  return (
    readStoredPortfolio(database, owner.membershipId) ?? {
      cash: owner.startingCash,
      holdings: [],
      orders: [],
    }
  );
}

/** Reads a portfolio that an order stored, or undefined when the student has placed no order in the class. */
export function readStoredPortfolio(
  database: DatabaseWriter,
  membershipId: MembershipId,
): Portfolio | undefined {
  const portfolio = database
    .select({ cash: portfolios.cash })
    .from(portfolios)
    .where(eq(portfolios.membershipId, membershipId))
    .get();
  if (portfolio === undefined) {
    return undefined;
  }
  return {
    cash: portfolio.cash,
    holdings: database
      .select({
        code: holdings.code,
        shares: holdings.shares,
        cost: holdings.cost,
      })
      .from(holdings)
      .where(eq(holdings.membershipId, membershipId))
      .orderBy(asc(holdings.code))
      .all(),
    orders: database
      .select()
      .from(orders)
      .where(eq(orders.membershipId, membershipId))
      .orderBy(asc(orders.placedAt), asc(orders.id))
      .all()
      .map(storedOrderOf),
  };
}

/** Stores an order that placeOrder accepted, and the portfolio of its owner with the starting cash of the class when it is the first order. Returns the number of the order. */
export function savePlacedOrder(
  database: DatabaseWriter,
  owner: PortfolioOwner,
  order: OpenOrder,
): OrderId {
  database
    .insert(portfolios)
    .values({ membershipId: owner.membershipId, cash: owner.startingCash })
    .onConflictDoNothing({ target: portfolios.membershipId })
    .run();
  const [saved] = database
    .insert(orders)
    .values({
      membershipId: owner.membershipId,
      code: order.code,
      side: order.side,
      lots: order.lots,
      limit: limitOf(order.price),
      placedAt: order.placedAt,
      shares: order.shares,
      tradingDay: order.tradingDay,
      tradesFrom: order.tradesFrom,
      expiresAt: order.expiresAt,
      checkedPrice: order.checkedPrice,
      setAsideCash: order.setAsideCash,
      ...stateColumns(order.state),
    })
    .returning({ id: orders.id })
    .all();
  if (saved === undefined) {
    throw new Error("SQLite stored no order and reported no error.");
  }
  return saved.id;
}

/** Stores the new state of an order. */
export function saveOrderState(
  database: DatabaseWriter,
  orderId: OrderId,
  state: OrderState,
): void {
  database
    .update(orders)
    .set(stateColumns(state))
    .where(eq(orders.id, orderId))
    .run();
}

/** Stores the cash of a portfolio and the holding of the stock of a fill. A holding without shares leaves the portfolio. */
export function saveFill(
  database: DatabaseWriter,
  membershipId: MembershipId,
  { cash, holding }: { cash: Rupiah; holding: Holding },
): void {
  database
    .update(portfolios)
    .set({ cash })
    .where(eq(portfolios.membershipId, membershipId))
    .run();
  if (holding.shares === 0) {
    database
      .delete(holdings)
      .where(
        and(
          eq(holdings.membershipId, membershipId),
          eq(holdings.code, holding.code),
        ),
      )
      .run();
    return;
  }
  const row = {
    membershipId,
    code: holding.code,
    shares: holding.shares,
    cost: holding.cost,
  };
  database
    .insert(holdings)
    .values(row)
    .onConflictDoUpdate({
      target: [holdings.membershipId, holdings.code],
      set: { shares: row.shares, cost: row.cost },
    })
    .run();
}

/** The portfolios that have an order that is waiting or resting, which a check has to fill or mark expired. */
export function listPortfoliosWithOpenOrders(
  database: DatabaseWriter,
): MembershipId[] {
  return database
    .selectDistinct({ membershipId: orders.membershipId })
    .from(orders)
    .where(inArray(orders.state, orderStates.filter(isOpenStateKind)))
    .orderBy(asc(orders.membershipId))
    .all()
    .map((row) => row.membershipId);
}
