import { formatPercent } from "~/formatting";
import type { MonthlyReturn } from "~/units/monthly-return";

/** The arrow and the sentence agree with the risk values that the map shows. */
export function diversificationChanged(
  average: MonthlyReturn,
  portfolio: MonthlyReturn,
): boolean {
  return formatPercent(average, "two") !== formatPercent(portfolio, "two");
}
