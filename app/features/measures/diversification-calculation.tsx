import { Fragment } from "react";
import type { ReactNode } from "react";
import { formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { AnalysisCalculation } from "./analysis-calculation";
import { analysisDiversificationInsight } from "./analysis-insight";
import type { PortfolioSummary } from "./measure-summaries";
import { weightedHoldingRisk } from "./weighted-holding-risk";
import styles from "./analysis.module.css";

export function DiversificationCalculation({
  portfolio,
}: {
  portfolio: PortfolioSummary;
}): ReactNode {
  const average = weightedHoldingRisk(portfolio);
  return (
    <AnalysisCalculation
      id="analysis-diversification"
      title={m.measures_analysis_without_diversification_label()}
      row={{
        label: m.measures_analysis_without_diversification_label(),
        value: formatPercent(average, "two"),
        formula: (
          <>
            σ̄ = Σ w<sub>i</sub> σ<sub>i</sub> ≈{" "}
            {portfolio.holdings.map((holding, index) => (
              <Fragment key={holding.code}>
                {index === 0 ? "" : " + "}
                <span className={styles["number"]}>
                  {formatPercent(holding.weight, "two")} ×{" "}
                  {formatPercent(holding.standardDeviation, "two")}
                </span>
              </Fragment>
            ))}{" "}
            ≈{" "}
            <span className={styles["number"]}>
              {formatPercent(average, "two")}
            </span>
          </>
        ),
      }}
    >
      <p>{m.measures_analysis_average_formula_notice()}</p>
      <p>
        {
          analysisDiversificationInsight(average, portfolio.standardDeviation)
            .text
        }
      </p>
    </AnalysisCalculation>
  );
}
