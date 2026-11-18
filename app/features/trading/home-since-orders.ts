import { activityStatus } from "./activity-selection";
import type { StoredOrder } from "./order-rows";

export function homeSinceOrders(
  orders: readonly StoredOrder[],
  dismissedAt: Date | undefined,
  now: Date,
): StoredOrder[] {
  const events: { order: StoredOrder; moment: Date }[] = [];
  for (const order of orders) {
    const moment = outcomeMoment(order, now);
    if (
      moment !== undefined &&
      moment <= now &&
      (dismissedAt === undefined || moment > dismissedAt)
    ) {
      events.push({ order, moment });
    }
  }
  return events
    .toSorted(
      (first, second) =>
        second.moment.getTime() - first.moment.getTime() ||
        second.order.id - first.order.id,
    )
    .map((event) => event.order);
}

function outcomeMoment(order: StoredOrder, now: Date): Date | undefined {
  switch (order.state.kind) {
    case "filled":
      return order.state.fill.filledAt;
    case "rejected":
      return order.state.rejectedAt;
    case "expired":
      return order.expiresAt;
    case "waiting":
    case "resting":
      return activityStatus(order, now) === "expired"
        ? order.expiresAt
        : undefined;
    case "cancelled":
      return undefined;
  }
}
