import type { Order } from "./order";

/** Sold holdings still need closes when a history replays their fills. */
export function filledStockCodes(orders: readonly Order[]): string[] {
  const codes = new Set<string>();
  for (const order of orders) {
    if (order.state.kind === "filled") codes.add(order.code);
  }
  return [...codes];
}
