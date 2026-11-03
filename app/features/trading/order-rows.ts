import type { Rupiah } from "~/units/rupiah";
import type { FillFailure, Order, OrderRequest, OrderState } from "./order";
import { cashChange } from "./trading-costs";
import type { OrderId, orders } from "./trading.schema";

/** An order that Portolab stored, with the number that identifies it. */
export type StoredOrder = Order & { id: OrderId };

type OrderRow = typeof orders.$inferSelect;

/** The columns that hold the state of an order. */
type StateColumns = Pick<
  typeof orders.$inferInsert,
  | "state"
  | "endedAt"
  | "quotedAt"
  | "tradePrice"
  | "tradeValue"
  | "tradeFee"
  | "tradeTax"
  | "failure"
  | "availableCash"
  | "heldLots"
  | "setAsideLots"
  | "setAsideOrders"
>;

const noEnd = {
  endedAt: null,
  quotedAt: null,
  tradePrice: null,
  tradeValue: null,
  tradeFee: null,
  tradeTax: null,
  failure: null,
  availableCash: null,
  heldLots: null,
  setAsideLots: null,
  setAsideOrders: null,
} satisfies Omit<StateColumns, "state">;

/** The limit of the price of an order, or null for a market order, as the column of the limit holds it. */
export function limitOf(price: OrderRequest["price"]): Rupiah | null {
  switch (price.kind) {
    case "market":
      return null;
    case "limit":
      return price.limit;
  }
}

/** The order that a row of the table of orders holds. */
export function storedOrderOf(row: OrderRow): StoredOrder {
  return {
    id: row.id,
    code: row.code,
    side: row.side,
    lots: row.lots,
    price:
      row.limit === null
        ? { kind: "market" }
        : { kind: "limit", limit: row.limit },
    placedAt: row.placedAt,
    shares: row.shares,
    tradingDay: row.tradingDay,
    tradesFrom: row.tradesFrom,
    expiresAt: row.expiresAt,
    checkedPrice: row.checkedPrice,
    setAsideCash: row.setAsideCash,
    state: stateOf(row),
  };
}

function stateOf(row: OrderRow): OrderState {
  switch (row.state) {
    case "waiting":
    case "resting":
      return { kind: row.state };
    case "filled": {
      const trade = {
        value: column(row, "tradeValue"),
        fee: column(row, "tradeFee"),
        tax: column(row, "tradeTax"),
      };
      return {
        kind: "filled",
        fill: {
          price: column(row, "tradePrice"),
          ...trade,
          cashChange: cashChange(row.side, trade),
          quotedAt: column(row, "quotedAt"),
          filledAt: column(row, "endedAt"),
        },
      };
    }
    case "expired":
      return { kind: "expired", expiredAt: column(row, "endedAt") };
    case "rejected":
      return {
        kind: "rejected",
        rejectedAt: column(row, "endedAt"),
        quotedAt: column(row, "quotedAt"),
        failure: failureOf(row),
      };
    case "cancelled":
      return { kind: "cancelled", cancelledAt: column(row, "endedAt") };
  }
}

function failureOf(row: OrderRow): FillFailure {
  switch (column(row, "failure")) {
    case "priceRose":
      return {
        kind: "priceRose",
        code: row.code,
        lots: row.lots,
        checkedPrice: row.checkedPrice,
        price: column(row, "tradePrice"),
        value: column(row, "tradeValue"),
        fee: column(row, "tradeFee"),
        tax: column(row, "tradeTax"),
        availableCash: column(row, "availableCash"),
      };
    case "sharesGone":
      return {
        kind: "sharesGone",
        code: row.code,
        lots: row.lots,
        heldLots: column(row, "heldLots"),
        setAside: {
          amount: column(row, "setAsideLots"),
          orders: column(row, "setAsideOrders"),
        },
      };
  }
}

/** The columns of the table of orders that hold a state. */
export function stateColumns(state: OrderState): StateColumns {
  switch (state.kind) {
    case "waiting":
    case "resting":
      return { state: state.kind, ...noEnd };
    case "filled": {
      const { fill } = state;
      return {
        ...noEnd,
        state: state.kind,
        endedAt: fill.filledAt,
        quotedAt: fill.quotedAt,
        tradePrice: fill.price,
        tradeValue: fill.value,
        tradeFee: fill.fee,
        tradeTax: fill.tax,
      };
    }
    case "expired":
      return { ...noEnd, state: state.kind, endedAt: state.expiredAt };
    case "rejected":
      return {
        ...noEnd,
        state: state.kind,
        endedAt: state.rejectedAt,
        quotedAt: state.quotedAt,
        ...failureColumns(state.failure),
      };
    case "cancelled":
      return { ...noEnd, state: state.kind, endedAt: state.cancelledAt };
  }
}

function failureColumns(failure: FillFailure): Partial<StateColumns> {
  switch (failure.kind) {
    case "priceRose":
      return {
        failure: failure.kind,
        tradePrice: failure.price,
        tradeValue: failure.value,
        tradeFee: failure.fee,
        tradeTax: failure.tax,
        availableCash: failure.availableCash,
      };
    case "sharesGone":
      return {
        failure: failure.kind,
        heldLots: failure.heldLots,
        setAsideLots: failure.setAside.amount,
        setAsideOrders: failure.setAside.orders,
      };
  }
}

// Only the code of this store writes these columns, and it writes each one that a state needs, so a missing one is a broken database.
function column<Name extends keyof OrderRow>(
  row: OrderRow,
  name: Name,
): NonNullable<OrderRow[Name]> {
  const value = row[name];
  if (value === null) {
    throw new Error(
      `The order ${String(row.id)} is ${row.state}, but its column ${name} is empty.`,
    );
  }
  return value;
}
