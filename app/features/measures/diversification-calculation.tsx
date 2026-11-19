import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { formatPercent } from "~/formatting";
import {
  Average,
  Formula,
  MathNumber,
  Operator,
  Sum,
  Variable,
  sumLines,
} from "~/math-notation";
import { m } from "~/paraglide/messages.js";
import { AnalysisCalculation } from "./analysis-calculation";
import { analysisDiversificationInsight } from "./analysis-insight";
import type { PortfolioSummary } from "./measure-summaries";
import { weightedHoldingRisk } from "./weighted-holding-risk";

// Two products of a weight and a risk fit on a line of a phone, beside the left side of the formula.
const holdingsPerLine = 2;

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
          <Formula
            left={<Average name="σ" />}
            right={
              <>
                <Sum />
                <Variable name="w" index="i" />
                <Variable name="σ" index="i" />
              </>
            }
            followingLines={[
              ...sumLines(
                "≈",
                portfolio.holdings.map((holding) => ({
                  key: holding.code,
                  term: (
                    <>
                      <MathNumber>
                        {formatPercent(holding.weight, "two")}
                      </MathNumber>
                      <Operator symbol="×" />
                      <MathNumber>
                        {formatPercent(holding.standardDeviation, "two")}
                      </MathNumber>
                    </>
                  ),
                })),
                holdingsPerLine,
              ),
              {
                operator: "≈",
                expression: (
                  <MathNumber>{formatPercent(average, "two")}</MathNumber>
                ),
              },
            ]}
          />
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
