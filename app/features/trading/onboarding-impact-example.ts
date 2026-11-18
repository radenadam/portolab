import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import { portfolioWeight } from "~/units/portfolio-weight";

const share = portfolioWeight(0.1);
const financialsBefore = portfolioWeight(0.409);

// The approved prototype uses a hypothetical bank purchase, so these numbers never stand for a recommendation or the student's portfolio.
export const onboardingImpactExample = {
  share,
  beta: { before: beta(0.65), after: beta(0.68) },
  risk: { before: monthlyReturn(0.0367), after: monthlyReturn(0.0372) },
  // Cash pays for the purchase and stays in the denominator of a sector weight, as sectorWeight counts it, so the sector gains the share. The buy fee moves only digits that the row does not show.
  sectorWeight: {
    before: financialsBefore,
    after: portfolioWeight(financialsBefore + share),
  },
};
