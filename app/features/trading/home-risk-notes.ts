import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { formatBeta, formatPercent, formatSharpeRatio } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";

/** The words compare the displayed numbers, so rounding cannot contradict them. */
export function homeRiskNotes(
  portfolio: Pick<PortfolioSummary, "beta" | "sharpeRatio" | "market">,
): Record<"beta" | "risk" | "sharpe", string> {
  const marketBeta = beta(1);
  const betaInputs = { value: formatBeta(marketBeta) };
  const isNegativeBeta =
    portfolio.beta < 0 && formatBeta(portfolio.beta) !== formatBeta(beta(0));
  const betaNote =
    formatBeta(portfolio.beta) === betaInputs.value
      ? m.trading_home_equal_beta_notice(betaInputs)
      : isNegativeBeta
        ? m.trading_home_negative_beta_notice(betaInputs)
        : portfolio.beta < marketBeta
          ? m.trading_home_lower_beta_notice(betaInputs)
          : m.trading_home_higher_beta_notice(betaInputs);
  const sharpe = portfolio.sharpeRatio;
  const sharpeInputs = {
    index: marketIndex.code,
    value: formatSharpeRatio(portfolio.market.sharpeRatio),
  };
  const sharpeNote = !sharpe.ok
    ? m.trading_home_market_sharpe_notice(sharpeInputs)
    : formatSharpeRatio(sharpe.value) === sharpeInputs.value
      ? m.trading_home_equal_sharpe_notice(sharpeInputs)
      : sharpe.value < portfolio.market.sharpeRatio
        ? m.trading_home_lower_sharpe_notice(sharpeInputs)
        : m.trading_home_higher_sharpe_notice(sharpeInputs);
  return {
    beta: betaNote,
    risk: m.trading_home_market_risk_notice({
      index: marketIndex.code,
      value: formatPercent(portfolio.market.standardDeviation, "two"),
    }),
    sharpe: sharpeNote,
  };
}
