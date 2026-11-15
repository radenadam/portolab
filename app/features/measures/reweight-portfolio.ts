import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioSummary } from "./measure-summaries";
import { measureAllocation } from "./measure-allocation";

// Keeping the estimates fixed isolates the effect of a change of weights.
export function reweightPortfolio(
  portfolio: PortfolioSummary,
  weights: ReadonlyMap<string, PortfolioWeight>,
) {
  const holdings = portfolio.holdings.map((holding) => ({
    code: holding.code,
    weight: weights.get(holding.code) ?? holding.weight,
    expectedReturn: { value: holding.expectedReturn },
    beta: { value: holding.beta },
    standardDeviation: { value: holding.standardDeviation },
  }));
  let invested = 0;
  for (const holding of holdings) invested += holding.weight;
  const cash = portfolioWeight(Math.max(0, 1 - invested));
  const covarianceMatrix = holdings.map((row) =>
    holdings.map((column) => {
      const pair = portfolio.pairs.find(
        (candidate) =>
          (candidate.first === row.code && candidate.second === column.code) ||
          (candidate.first === column.code && candidate.second === row.code),
      );
      if (pair === undefined)
        throw new Error(
          `The portfolio has no covariance for ${row.code} and ${column.code}.`,
        );
      return { value: pair.covariance };
    }),
  );
  return {
    ...measureAllocation(holdings, covarianceMatrix, {
      expectedReturn: { value: portfolio.market.expectedReturn },
      riskFreeRate: portfolio.market.riskFreeRate,
    }),
    holdings,
    cash,
  };
}
