import { measureAllocation } from "~/features/measures/measure-allocation";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import type { Correlation } from "~/units/correlation";
import { weightedHoldingRisk } from "~/features/measures/weighted-holding-risk";
import { monthlyVariance } from "~/units/monthly-variance";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";

export const defaultPairWeight = portfolioWeight(0.5);

export function twoStockAllocation(
  portfolio: PortfolioSummary,
  {
    first,
    second,
    weight,
    correlation,
  }: {
    first: string;
    second: string;
    weight: PortfolioWeight;
    correlation: Correlation;
  },
) {
  const holdings = [first, second].map((code, index) => {
    const holding = portfolio.holdings.find((entry) => entry.code === code);
    if (holding === undefined)
      throw new Error(`The lesson has no estimates for ${code}.`);
    return {
      ...holding,
      weight: index === 0 ? weight : portfolioWeight(1 - weight),
    };
  });
  const covarianceMatrix = holdings.map((row, rowIndex) =>
    holdings.map((column, columnIndex) => ({
      value:
        rowIndex === columnIndex
          ? row.variance
          : monthlyVariance(
              correlation * row.standardDeviation * column.standardDeviation,
            ),
    })),
  );
  const measured = measureAllocation(
    holdings.map((holding) => ({
      code: holding.code,
      weight: holding.weight,
      expectedReturn: { value: holding.expectedReturn },
      standardDeviation: { value: holding.standardDeviation },
      beta: { value: holding.beta },
    })),
    covarianceMatrix,
    {
      expectedReturn: { value: portfolio.market.expectedReturn },
      riskFreeRate: portfolio.market.riskFreeRate,
    },
  );
  return {
    expectedReturn: measured.expectedReturn,
    variance: measured.variance,
    standardDeviation: measured.standardDeviation,
    averageRisk: weightedHoldingRisk({ holdings }),
  };
}
