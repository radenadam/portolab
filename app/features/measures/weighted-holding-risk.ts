import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { PortfolioSummary } from "./measure-summaries";

/** Cash adds zero risk, so the weights retain their share of the whole portfolio. */
export function weightedHoldingRisk(portfolio: {
  holdings: readonly Pick<
    PortfolioSummary["holdings"][number],
    "weight" | "standardDeviation"
  >[];
}): MonthlyReturn {
  let average = 0;
  for (const holding of portfolio.holdings) {
    average += holding.weight * holding.standardDeviation;
  }
  return monthlyReturn(average);
}
