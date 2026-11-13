import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { sharpeRatio } from "~/units/sharpe-ratio";
import type { SharpeRatio } from "~/units/sharpe-ratio";
import type { Measure } from "./measure";

// Decision 0031 explains why Portolab takes these ratios of a portfolio per month, from the same months and risk-free rate as its other measures.

/** The expected return of a portfolio and the risk-free rate of the same months, whose difference each ratio divides by a measure of risk. */
interface ExcessReturn {
  expectedReturn: MonthlyReturn;
  riskFreeRate: MonthlyReturn;
}

/** The return above the risk-free rate for each unit of the standard deviation, which counts every risk of the portfolio. */
export type SharpeRatioMeasure = Measure<
  "sharpeRatio",
  SharpeRatio,
  ExcessReturn & { standardDeviation: MonthlyReturn }
>;

/** The return above the risk-free rate for each unit of beta, which counts only the risk of the market. */
export type TreynorRatioMeasure = Measure<
  "treynorRatio",
  MonthlyReturn,
  ExcessReturn & { beta: Beta }
>;

/** Why a portfolio has no Treynor ratio: its beta is 0, so the ratio would divide by zero, or below 0, so the ratio would turn a return below the risk-free rate into a positive number. */
export interface BetaNotPositive {
  kind: "betaNotPositive";
  beta: Beta;
}

/** Measures the Sharpe ratio of a portfolio from its standard deviation, which must be above zero. */
export function measureSharpeRatio(
  excess: ExcessReturn,
  standardDeviation: MonthlyReturn,
): SharpeRatioMeasure {
  return {
    formula: "sharpeRatio",
    value: sharpeRatio(
      (excess.expectedReturn - excess.riskFreeRate) / standardDeviation,
    ),
    inputs: { ...excess, standardDeviation },
  };
}

/** Measures the Treynor ratio of a portfolio from its beta, or fails for a beta at or below zero. */
export function measureTreynorRatio(
  excess: ExcessReturn,
  beta: Beta,
): Result<TreynorRatioMeasure, BetaNotPositive> {
  if (beta <= 0) {
    return fail({ kind: "betaNotPositive", beta });
  }
  return succeed({
    formula: "treynorRatio",
    value: monthlyReturn((excess.expectedReturn - excess.riskFreeRate) / beta),
    inputs: { ...excess, beta },
  });
}
