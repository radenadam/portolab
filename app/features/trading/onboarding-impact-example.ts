import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import { portfolioWeight } from "~/units/portfolio-weight";

// The approved prototype uses a hypothetical bank purchase, so these numbers never stand for a recommendation or the student's portfolio.
export const onboardingImpactExample = {
  share: portfolioWeight(0.1),
  beta: { before: beta(0.65), after: beta(0.68) },
  risk: { before: monthlyReturn(0.0367), after: monthlyReturn(0.0372) },
  sectorWeight: {
    before: portfolioWeight(0.409),
    after: portfolioWeight(0.502),
  },
};
