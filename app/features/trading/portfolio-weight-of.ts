import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";

/** Cash and holdings use the same positive total, so the screen and its measures agree on each share. */
export function portfolioWeightOf(
  value: Rupiah,
  total: Rupiah,
): PortfolioWeight {
  return portfolioWeight(value / total);
}
