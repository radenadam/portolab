import type { FieldOption } from "~/form";
import { m } from "~/paraglide/messages.js";
export const activityFilters = [
  "all",
  "waiting",
  "filled",
  "rejected",
  "expired",
  "cancelled",
] as const;
export type ActivityFilter = (typeof activityFilters)[number];
export type ActivityView = "orders" | "journal";

const labels: Record<ActivityFilter, () => string> = {
  all: m.trading_activity_all_label,
  waiting: m.trading_activity_waiting_label,
  filled: m.trading_activity_filled_label,
  rejected: m.trading_activity_rejected_label,
  expired: m.trading_activity_expired_label,
  cancelled: m.trading_activity_cancelled_label,
};

export function activityStatusLabel(status: ActivityFilter): string {
  return labels[status]();
}

export function activityFilterOptions(): FieldOption<ActivityFilter>[] {
  return activityFilters.map((value) => ({
    value,
    label: activityStatusLabel(value),
  }));
}

export function activityViewOptions(): FieldOption<ActivityView>[] {
  return [
    { value: "orders", label: m.trading_activity_orders_label() },
    { value: "journal", label: m.trading_activity_journal_label() },
  ];
}
