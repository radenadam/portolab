import type { OrderId } from "./trading.schema.ts";

/** The id of the row of an order in Aktivitas, at which a link to that order lands. */
export function orderEntryId(orderId: OrderId): string {
  return `order-${String(orderId)}`;
}
