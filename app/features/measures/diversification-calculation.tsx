import { NumberText } from "~/number-text";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { AnalysisCalculation } from "./analysis-calculation";
import { analysisDiversificationInsight } from "./analysis-insight";
import type { PortfolioSummary } from "./measure-summaries";
import { weightedHoldingRisk } from "./weighted-holding-risk";

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
                <NumberText whole>
                  {formatPercent(holding.weight, "two")} ×{" "}
                  {formatPercent(holding.standardDeviation, "two")}
                </NumberText>
              </Fragment>
            ))}{" "}
            ≈ <NumberText whole>{formatPercent(average, "two")}</NumberText>
          </>
        ),
      }}
    >
      <p>
        <NumberText>{m.measures_analysis_average_formula_notice()}</NumberText>
      </p>
      <p>
        <NumberText>
          {
            analysisDiversificationInsight(average, portfolio.standardDeviation)
              .text
          }
        </NumberText>
      </p>
    </AnalysisCalculation>
  );
}
