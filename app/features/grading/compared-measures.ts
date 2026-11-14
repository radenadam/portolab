import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { riskMeasureFailureText } from "~/features/measures/measure-failure-text";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { SharpeRatio } from "~/units/sharpe-ratio";

/** The measures of a portfolio that the lecturer compares across the students of a class. */
export interface ComparedMeasures {
  /** Jensen's alpha keeps the course's name for the distance from the security market line. */
  distance: MonthlyReturn;
  expectedReturn: MonthlyReturn;
  standardDeviation: MonthlyReturn;
  beta: Beta;
  requiredReturn: MonthlyReturn;
  riskFreeRate: MonthlyReturn;
  sharpe: Result<SharpeRatio, string>;
  treynor: Result<MonthlyReturn, string>;
}

export function comparedMeasures(summary: PortfolioSummary): ComparedMeasures {
  return {
    distance: summary.securityMarketLine.value,
    expectedReturn: summary.expectedReturn,
    standardDeviation: summary.standardDeviation,
    beta: summary.beta,
    requiredReturn: summary.requiredReturn.value,
    riskFreeRate: summary.market.riskFreeRate.value,
    sharpe: summary.sharpeRatio.ok
      ? succeed(summary.sharpeRatio.value)
      : fail(riskMeasureFailureText(summary.sharpeRatio.failure)),
    treynor: summary.treynorRatio.ok
      ? succeed(summary.treynorRatio.value)
      : fail(riskMeasureFailureText(summary.treynorRatio.failure)),
  };
}
