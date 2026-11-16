import type { OrderId } from "./trading.schema.ts";

export function journalEntryId(orderId: OrderId): string {
  return `journal-${String(orderId)}`;
}
