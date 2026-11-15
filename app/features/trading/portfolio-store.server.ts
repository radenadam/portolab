import { and, asc, eq, inArray } from "drizzle-orm";
import type { DatabaseWriter } from "~/database/database.server";
import type { ClassId, MembershipId } from "~/features/classes/classes.schema";
import type { Rupiah } from "~/units/rupiah";
import type { Holding } from "./holding-after-fill";
import type { OpenOrder, OrderState } from "./order";
import { limitOf, stateColumns, storedOrderOf } from "./order-rows";
import type { StoredOrder } from "./order-rows";
import { isOpenStateKind } from "./open-orders";
import { holdings, orderStates, orders, portfolios } from "./trading.schema";
import type { OrderId, PortfolioId } from "./trading.schema";
import { portfolioOwnerColumns } from "./portfolio-owner-columns";

/** What a portfolio holds: its cash, its holdings by code, and its orders in the order in which the owner placed them. */
export interface Portfolio {
  cash: Rupiah;
  holdings: Holding[];
  orders: StoredOrder[];
}

/** A demonstration has no membership, so readers of the student roster cannot count it. */
export type PortfolioOwner = { startingCash: Rupiah } & (
  | { kind: "membership"; membershipId: MembershipId }
  | { kind: "demonstration"; classId: ClassId }
);

export type PortfolioKind = PortfolioOwner["kind"];

/** Reads the portfolio of an owner, which is the starting cash of the class and nothing else before the first order. */
export function readPortfolio(
  database: DatabaseWriter,
  owner: PortfolioOwner,
): Portfolio {
  return (
    readStoredPortfolio(database, owner) ?? {
      cash: owner.startingCash,
      holdings: [],
      orders: [],
    }
  );
}

export function readStoredPortfolio(
  database: DatabaseWriter,
  owner: PortfolioOwner,
): Portfolio | undefined {
  const portfolioId = findPortfolioId(database, owner);
  return portfolioId === undefined
    ? undefined
    : readPortfolioById(database, portfolioId);
}

export function findPortfolioId(
  database: DatabaseWriter,
  owner: PortfolioOwner,
): PortfolioId | undefined {
  return database
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(ownerCondition(owner))
    .get()?.id;
}

function ownerCondition(owner: PortfolioOwner) {
  switch (owner.kind) {
    case "membership":
      return eq(portfolios.membershipId, owner.membershipId);
    case "demonstration":
      return eq(portfolios.demonstrationClassId, owner.classId);
  }
}

/** Placement holds a transaction so accepted orders cannot create separate portfolios for one owner. */
function ensurePortfolio(
  database: DatabaseWriter,
  owner: PortfolioOwner,
): PortfolioId {
  database
    .insert(portfolios)
    .values({ ...portfolioOwnerColumns(owner), cash: owner.startingCash })
    .onConflictDoNothing()
    .run();
  const portfolioId = findPortfolioId(database, owner);
  if (portfolioId === undefined)
    throw new Error("SQLite stored no portfolio and reported no error.");
  return portfolioId;
}

export function readPortfolioById(
  database: DatabaseWriter,
  portfolioId: PortfolioId,
): Portfolio | undefined {
  const portfolio = database
    .select({ cash: portfolios.cash })
    .from(portfolios)
    .where(eq(portfolios.id, portfolioId))
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
      .where(eq(holdings.portfolioId, portfolioId))
      .orderBy(asc(holdings.code))
      .all(),
    orders: database
      .select()
      .from(orders)
      .where(eq(orders.portfolioId, portfolioId))
      .orderBy(asc(orders.placedAt), asc(orders.id))
      .all()
      .map(storedOrderOf),
  };
}

/** The fill check needs the portfolio that this write created, including on the first order. */
export function savePlacedOrder(
  database: DatabaseWriter,
  owner: PortfolioOwner,
  order: OpenOrder,
): { orderId: OrderId; portfolioId: PortfolioId } {
  const portfolioId = ensurePortfolio(database, owner);
  const [saved] = database
    .insert(orders)
    .values({
      portfolioId,
      code: order.code,
      side: order.side,
      lots: order.lots,
      limit: limitOf(order.price),
      reason: order.reason ?? null,
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
  return { orderId: saved.id, portfolioId };
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
  portfolioId: PortfolioId,
  { cash, holding }: { cash: Rupiah; holding: Holding },
): void {
  database
    .update(portfolios)
    .set({ cash })
    .where(eq(portfolios.id, portfolioId))
    .run();
  if (holding.shares === 0) {
    database
      .delete(holdings)
      .where(
        and(
          eq(holdings.portfolioId, portfolioId),
          eq(holdings.code, holding.code),
        ),
      )
      .run();
    return;
  }
  const row = {
    portfolioId,
    code: holding.code,
    shares: holding.shares,
    cost: holding.cost,
  };
  database
    .insert(holdings)
    .values(row)
    .onConflictDoUpdate({
      target: [holdings.portfolioId, holdings.code],
      set: { shares: row.shares, cost: row.cost },
    })
    .run();
}

/** The portfolios that have an order that is waiting or resting, which a check has to fill or mark expired. */
export function listPortfoliosWithOpenOrders(
  database: DatabaseWriter,
): PortfolioId[] {
  return database
    .selectDistinct({ portfolioId: orders.portfolioId })
    .from(orders)
    .where(inArray(orders.state, orderStates.filter(isOpenStateKind)))
    .orderBy(asc(orders.portfolioId))
    .all()
    .map((row) => row.portfolioId);
}
