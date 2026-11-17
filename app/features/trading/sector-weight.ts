import { companyOf } from "~/features/market-data/company-of";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";

/** Cash stays in the denominator of each holding's weight but belongs to no sector. */
export function sectorWeight(
  holdings: readonly { code: string; weight: PortfolioWeight }[],
  code: string,
): PortfolioWeight {
  const sector = companyOf(code).sector;
  let weight = 0;
  for (const holding of holdings) {
    if (companyOf(holding.code).sector === sector) weight += holding.weight;
  }
  // Binary rounding of the individual weights can put their sum just above one.
  return portfolioWeight(Math.min(1, weight));
}
