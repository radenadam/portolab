import { compareRoundedNumbers } from "~/compare-rounded-numbers";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { correlation } from "~/units/correlation";
import type { Correlation } from "~/units/correlation";

const marketLikeBetaMinimum = beta(0.8);
const marketLikeBetaMaximum = beta(1.2);
const sameDirectionMinimum = correlation(0.5);

/** The comparison lines use the thresholds of StockView in the approved prototype. */
export function stockComparisonText(
  measure:
    { kind: "beta"; value: Beta } | { kind: "correlation"; value: Correlation },
): string {
  switch (measure.kind) {
    case "beta": {
      if (
        compareRoundedNumbers(measure.value, marketLikeBetaMinimum, "ratio") ===
        "fall"
      )
        return m.measures_stock_calm_notice();
      return compareRoundedNumbers(
        measure.value,
        marketLikeBetaMaximum,
        "ratio",
      ) === "rise"
        ? m.measures_stock_volatile_notice()
        : m.measures_stock_market_like_notice();
    }
    case "correlation":
      return compareRoundedNumbers(
        measure.value,
        sameDirectionMinimum,
        "ratio",
      ) === "fall"
        ? m.measures_stock_different_direction_notice()
        : m.measures_stock_same_direction_notice();
  }
}
