import type { PortfolioWeight } from "~/units/portfolio-weight";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { PortfolioValuation, ValuedHolding } from "./value-portfolio";
import { portfolioWeightOf } from "./portfolio-weight-of";

export interface HomeHolding {
  holding: ValuedHolding;
  averageCost: Rupiah;
  weight: PortfolioWeight | undefined;
}

/** Both stock and cash weights use the whole portfolio, so their bars share one denominator even without risk measures. */
export function homeHoldings(valuation: PortfolioValuation): {
  holdings: HomeHolding[];
  cashWeight: PortfolioWeight | undefined;
} {
  const total = valuation.total;
  const weightTotal =
    total !== undefined && total.value > 0 ? total.value : undefined;
  return {
    holdings: valuation.holdings.map((holding) => ({
      holding,
      averageCost: rupiah(Math.round(holding.cost / holding.shares)),
      weight:
        weightTotal === undefined || holding.kind === "unpriced"
          ? undefined
          : portfolioWeightOf(holding.value, weightTotal),
    })),
    cashWeight:
      weightTotal === undefined
        ? undefined
        : portfolioWeightOf(valuation.cash, weightTotal),
  };
}
