import { beta, marketBeta } from "~/units/beta";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";

export const lessonBetaRange = { minimum: 0, maximum: 2, step: 0.05 };

export function defaultLessonBeta(portfolio: PortfolioSummary | undefined) {
  return portfolio === undefined
    ? marketBeta
    : beta(
        Math.round(portfolio.beta / lessonBetaRange.step) *
          lessonBetaRange.step,
      );
}
