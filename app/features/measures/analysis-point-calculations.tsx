import { Fragment } from "react";
import type { ReactNode } from "react";
import { formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { AnalysisCalculation } from "./analysis-calculation";
import { StandardDeviationFormula } from "./formulas";
import type { AnalysisHolding } from "./analysis-holdings";
import {
  HoldingRequiredReturnPart,
  holdingAlphaRow,
  holdingAlphaTitle,
} from "./holding-alpha-calculation";

export function AnalysisPointCalculations({
  holdings,
}: {
  holdings: readonly AnalysisHolding[];
}): ReactNode {
  return holdings.map((holding) => (
    <Fragment key={holding.code}>
      <AnalysisCalculation
        id={`analysis-stock-${holding.code}-alpha`}
        title={holdingAlphaTitle(holding.code)}
        row={holdingAlphaRow(holding)}
      >
        <HoldingRequiredReturnPart holding={holding} />
      </AnalysisCalculation>
      <AnalysisCalculation
        id={`analysis-stock-${holding.code}-risk`}
        title={m.measures_analysis_stock_calculation_title({
          code: holding.code,
          measure: m.measures_standard_deviation_label(),
        })}
        row={{
          label: m.measures_standard_deviation_label(),
          value: formatPercent(holding.standardDeviation, "two"),
          description: m.measures_standard_deviation_formula_notice(),
          formula: (
            <StandardDeviationFormula of="i" variance={holding.variance} />
          ),
        }}
      />
    </Fragment>
  ));
}
