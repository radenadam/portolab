import { monthlyVariance } from "~/units/monthly-variance";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";

export function weightedCovariance(
  first: PortfolioWeight,
  second: PortfolioWeight,
  covariance: MonthlyVariance,
): MonthlyVariance {
  return monthlyVariance(first * second * covariance);
}
