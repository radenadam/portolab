import { Fragment } from "react";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { AnalysisCalculation } from "./analysis-calculation";
import { measureSecurityMarketLineDistance } from "./capm";
import { MarketLineFormula, RequiredReturnFormula } from "./capm-formulas";
import { StandardDeviationFormula } from "./formulas";
import type { AnalysisHolding } from "./analysis-holdings";

export function AnalysisPointCalculations({
  holdings,
}: {
  holdings: readonly AnalysisHolding[];
}): ReactNode {
  return holdings.map((holding) => (
    <Fragment key={holding.code}>
      <AnalysisCalculation
        id={`analysis-stock-${holding.code}-alpha`}
        title={m.measures_analysis_stock_calculation_title({
          code: holding.code,
          measure: m.measures_market_line_label(),
        })}
        row={{
          label: m.measures_market_line_label(),
          value: (
            <ChangeText
              colored
              change={formatSignedPercent(holding.distance)}
            />
          ),
          formula: (
            <MarketLineFormula
              of="i"
              distance={measureSecurityMarketLineDistance(
                holding.expectedReturn,
                holding.requiredReturn,
              )}
            />
          ),
        }}
      >
        <p>
          <RequiredReturnFormula of="i" required={holding.requiredReturn} />
        </p>
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
          formula: (
            <StandardDeviationFormula of="i" variance={holding.variance} />
          ),
        }}
      />
    </Fragment>
  ));
}
