import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { formatPercent, formatSharpeRatio, formatVariance } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { PortfolioVarianceFormula } from "./formulas";
import { riskMeasureFailureText } from "./measure-failure-text";
import { capmRows } from "./measure-list";
import type { MeasureRow } from "./measure-list";
import type { PortfolioSummary } from "./measure-summaries";
import styles from "./measures.module.css";
import { portfolioConceptRows } from "./portfolio-concept-rows";
import { SharpeRatioFormula, TreynorRatioFormula } from "./ratio-formulas";

/** The portfolio and its analysis share rows so their values and calculations cannot drift. */
export function portfolioMeasureRows(
  portfolio: PortfolioSummary,
  reader: PortfolioReader,
): MeasureRow[] {
  const concepts = portfolioConceptRows(portfolio, reader);
  return [
    concepts.expectedReturn,
    {
      label: m.measures_variance_label(),
      value: formatVariance(portfolio.variance),
      formula: <PortfolioVarianceFormula />,
    },
    concepts.risk,
    concepts.beta,
    ...ratioRows(portfolio),
    ...capmRows("p", portfolio),
  ];
}

/** The rows of the Sharpe ratio and the Treynor ratio of a portfolio, each with its formula and its inputs, and for a ratio that the portfolio does not have, the reason in place of its value. */
function ratioRows(portfolio: PortfolioSummary): MeasureRow[] {
  const excessReturn = {
    expectedReturn: portfolio.expectedReturn,
    riskFreeRate: portfolio.market.riskFreeRate.value,
  };
  const { sharpeRatio, treynorRatio } = portfolio;
  const sharpeFormula = (
    <SharpeRatioFormula
      inputs={{
        ...excessReturn,
        standardDeviation: portfolio.standardDeviation,
      }}
    />
  );
  const treynorFormula = (
    <TreynorRatioFormula inputs={{ ...excessReturn, beta: portfolio.beta }} />
  );
  return [
    {
      label: m.measures_sharpe_ratio_label(),
      concept: "sharpe",
      calculation: sharpeFormula,
      example: !sharpeRatio.ok ? (
        <p>{riskMeasureFailureText(sharpeRatio.failure)}</p>
      ) : undefined,
      value: sharpeRatio.ok
        ? formatSharpeRatio(sharpeRatio.value)
        : m.measures_no_value_label(),
      formula: (
        <>
          {sharpeFormula}
          {!sharpeRatio.ok && (
            <span className={styles["formulaNote"]}>
              {riskMeasureFailureText(sharpeRatio.failure)}
            </span>
          )}
        </>
      ),
    },
    {
      label: m.measures_treynor_ratio_label(),
      concept: "treynor",
      calculation: treynorFormula,
      example: !treynorRatio.ok ? (
        <p>{riskMeasureFailureText(treynorRatio.failure)}</p>
      ) : undefined,
      value: treynorRatio.ok
        ? formatPercent(treynorRatio.value, "two")
        : m.measures_no_value_label(),
      formula: (
        <>
          {treynorFormula}
          {!treynorRatio.ok && (
            <span className={styles["formulaNote"]}>
              {riskMeasureFailureText(treynorRatio.failure)}
            </span>
          )}
        </>
      ),
    },
  ];
}
