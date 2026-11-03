import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
// drizzle-kit and the browser tests load the schemas without the aliases of the app, so every import is a relative path.
import { memberships } from "../classes/classes.schema.ts";
import type { MembershipId } from "../classes/classes.schema.ts";
import type { Lots, OrderLots } from "../../units/lots.ts";
import type { Rupiah } from "../../units/rupiah.ts";
import type { Shares } from "../../units/shares.ts";

/** The number that identifies an order. */
export type OrderId = number & { readonly brand: "OrderId" };

// The store of orders writes the sides, states, and failures of order.ts into these columns and reads them back, so a name that one of them lacks is a type error there.
const orderSides = ["buy", "sell"] as const;
/** The names of the states of an order, as the column of the state holds them. */
export const orderStates = [
  "waiting",
  "resting",
  "filled",
  "expired",
  "rejected",
  "cancelled",
] as const;
const fillFailures = ["priceRose", "sharesGone"] as const;

/** The cash of each student in each class. A student starts with the starting cash of the class, and the first order in the class stores it here, so a membership without a row has that cash and nothing else. A portfolio lives as long as its membership, which ends when the person who runs the server deletes the class or the student, as the privacy notice states. */
export const portfolios = sqliteTable("portfolios", {
  membershipId: integer("membership_id")
    .$type<MembershipId>()
    .primaryKey()
    .references(() => memberships.id, { onDelete: "cascade" }),
  cash: integer("cash").$type<Rupiah>().notNull(),
});

/** The shares of each stock that a portfolio holds, and what they cost with the broker fees of their purchases. A sale of every share removes the row. A holding lives as long as its portfolio, as the privacy notice states. */
export const holdings = sqliteTable(
  "holdings",
  {
    membershipId: integer("membership_id")
      .$type<MembershipId>()
      .notNull()
      .references(() => portfolios.membershipId, { onDelete: "cascade" }),
    code: text("code").notNull(),
    shares: integer("shares").$type<Shares>().notNull(),
    cost: integer("cost").$type<Rupiah>().notNull(),
  },
  (table) => [primaryKey({ columns: [table.membershipId, table.code] })],
);

/** Each order of a portfolio, with what Portolab fixed when it accepted the order and where the order stands, as decision 0016 explains. A market order has no limit. An order lives as long as its portfolio, as the privacy notice states. */
export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").$type<OrderId>().primaryKey({ autoIncrement: true }),
    membershipId: integer("membership_id")
      .$type<MembershipId>()
      .notNull()
      .references(() => portfolios.membershipId, { onDelete: "cascade" }),
    code: text("code").notNull(),
    side: text("side", { enum: orderSides }).notNull(),
    lots: integer("lots").$type<OrderLots>().notNull(),
    limit: integer("limit").$type<Rupiah>(),
    placedAt: integer("placed_at", { mode: "timestamp_ms" }).notNull(),
    shares: integer("shares").$type<Shares>().notNull(),
    tradingDay: text("trading_day").notNull(),
    tradesFrom: integer("trades_from", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    checkedPrice: integer("checked_price").$type<Rupiah>().notNull(),
    setAsideCash: integer("set_aside_cash").$type<Rupiah>().notNull(),
    state: text("state", { enum: orderStates }).notNull(),
    /** When the order filled, expired, was rejected, or was cancelled. An open order has none. */
    endedAt: integer("ended_at", { mode: "timestamp_ms" }),
    /** When the delayed price that filled or rejected the order was quoted. */
    quotedAt: integer("quoted_at", { mode: "timestamp_ms" }),
    /** The trade of a fill, or the trade that a rejected purchase could not pay for. */
    tradePrice: integer("trade_price").$type<Rupiah>(),
    tradeValue: integer("trade_value").$type<Rupiah>(),
    tradeFee: integer("trade_fee").$type<Rupiah>(),
    tradeTax: integer("trade_tax").$type<Rupiah>(),
    /** Why a check rejected the order, with the cash or the shares that it found. */
    failure: text("failure", { enum: fillFailures }),
    availableCash: integer("available_cash").$type<Rupiah>(),
    heldLots: integer("held_lots").$type<Lots>(),
    /** The lots that the other open sell orders of a rejected sale set aside, and how many orders they were. */
    setAsideLots: integer("set_aside_lots").$type<Lots>(),
    setAsideOrders: integer("set_aside_orders"),
  },
  (table) => [
    index("orders_membership_id_index").on(table.membershipId),
    index("orders_state_index").on(table.state),
  ],
);
