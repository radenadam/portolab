import { m } from "~/paraglide/messages.js";
import type { Beta } from "~/units/beta";
import type { Correlation } from "~/units/correlation";

/** The comparison lines use the thresholds of StockView in the approved prototype. */
export function stockComparisonText(
  measure:
    { kind: "beta"; value: Beta } | { kind: "correlation"; value: Correlation },
): string {
  switch (measure.kind) {
    case "beta":
      if (measure.value < 0.8) return m.measures_stock_calm_notice();
      return measure.value > 1.2
        ? m.measures_stock_volatile_notice()
        : m.measures_stock_market_like_notice();
    case "correlation":
      return measure.value < 0.5
        ? m.measures_stock_different_direction_notice()
        : m.measures_stock_same_direction_notice();
  }
}
