import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { monthsPerYear } from "./measure-risk-free-rate";

// The sentences that say what a formula computes, which take a number or a name from the code, so every formula of one measure says the same.

/** What the formula of a correlation computes, with the bounds that a correlation keeps. */
export function correlationFormulaText(): string {
  return m.measures_correlation_formula_notice({
    negative: formatNumber(-1),
    positive: formatNumber(1),
  });
}

/** What the formula of the beta of a stock computes. */
export function betaFormulaText(): string {
  return m.measures_beta_formula_notice({ index: marketIndex.code });
}

/** What the formula of the return that CAPM requires computes. */
export function requiredReturnFormulaText(): string {
  return m.measures_required_return_formula_notice({ index: marketIndex.code });
}

/** What the formula of the security market line gives. */
export function marketLineFormulaText(): string {
  return m.measures_market_line_formula_notice({ index: marketIndex.code });
}

/** What the formula of a standard deviation computes. */
export function standardDeviationFormulaText(): string {
  return m.measures_standard_deviation_formula_notice();
}

/** What the formula of the expected return of a portfolio computes. */
export function weightedReturnFormulaText(): string {
  return m.measures_weighted_return_formula_notice();
}

/** What the formula of the beta of a portfolio computes. */
export function weightedBetaFormulaText(): string {
  return m.measures_weighted_beta_formula_notice();
}

/** What the formula of Jensen's alpha computes. */
export function alphaFormulaText(): string {
  return m.measures_alpha_formula_notice();
}

/** What the formula of the Sharpe ratio computes. */
export function sharpeFormulaText(): string {
  return m.measures_sharpe_formula_notice();
}

/** What the formula of the Treynor ratio computes. */
export function treynorFormulaText(): string {
  return m.measures_treynor_formula_notice();
}

/** What the formula of the variance of a portfolio computes. */
export function portfolioVarianceFormulaText(): string {
  return m.measures_portfolio_variance_formula_notice();
}

/** What the formula of the risk-free rate of one month computes. */
export function riskFreeFormulaText(): string {
  return m.measures_risk_free_formula_notice({
    months: formatNumber(monthsPerYear),
  });
}
