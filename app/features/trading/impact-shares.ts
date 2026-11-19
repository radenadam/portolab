import type { FieldOption } from "~/form";
import { formatPercent } from "~/formatting";
import { portfolioWeight } from "~/units/portfolio-weight";

const impactShares = [
  portfolioWeight(0.05),
  portfolioWeight(0.1),
  portfolioWeight(0.2),
] as const;
export const defaultImpactShare = impactShares[1];

export function impactShareOptions(): FieldOption[] {
  return impactShares.map((share) => ({
    value: String(share),
    label: formatPercent(share, "integer"),
  }));
}
