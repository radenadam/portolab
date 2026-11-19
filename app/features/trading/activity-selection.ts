import type { Result } from "~/result";
import { m } from "~/paraglide/messages.js";
import { parseOrderChoice } from "./order-form-fields";
import type { ActivityFilter } from "./activity-options";
import { activityFilterOptions } from "./activity-options";
import { hasOpenState, isOpenOrder } from "./open-orders";
import type { Order } from "./order";

export type ActivityStatus =
  "waiting" | "filled" | "rejected" | "expired" | "cancelled";
export type { ActivityFilter } from "./activity-options";

export function parseActivityFilter(
  value: unknown,
  source: string,
): Result<ActivityFilter, string> {
  return parseOrderChoice(value === null ? "all" : value, source, {
    options: activityFilterOptions(),
    unknownChoice: m.trading_activity_unknown_choice_error,
  });
}

/** Expiry belongs to the moment, even before the job stores the expired state. */
export function activityStatus(order: Order, now: Date): ActivityStatus {
  if (hasOpenState(order) && !isOpenOrder(order, now)) return "expired";
  switch (order.state.kind) {
    case "waiting":
    case "resting":
      return "waiting";
    case "filled":
    case "rejected":
    case "expired":
    case "cancelled":
      return order.state.kind;
  }
}
