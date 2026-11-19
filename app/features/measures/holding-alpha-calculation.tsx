import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { AnalysisHolding } from "./analysis-holdings";
import { CalculationPart } from "./calculation-part";
import { measureSecurityMarketLineDistance } from "./capm";
import { MarketLineFormula, RequiredReturnFormula } from "./capm-formulas";
import { requiredReturnFormulaText } from "./formula-texts";
import type { MeasureRow } from "./measure-list";

// The calculation of the alpha of one stock of a portfolio, which Analisis and lesson 9 open alike.

/** The title of the calculation of the alpha of one stock, such as "BBCA: Alpha Jensen". */
export function holdingAlphaTitle(code: string): string {
  return m.measures_analysis_stock_calculation_title({
    code,
    measure: m.measures_market_line_label(),
  });
}

/** The alpha of one stock of a portfolio as a measure, with its formula and its numbers, which Analisis and lesson 9 show alike. */
export function holdingAlphaRow(holding: AnalysisHolding): MeasureRow {
  return {
    label: m.measures_market_line_label(),
    description: m.measures_alpha_formula_notice(),
    value: (
      <ChangeText colored change={formatSignedPercent(holding.distance)} />
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
  };
}

/** The return that CAPM requires of one stock, from which its alpha comes, as a part of the calculation of the alpha. */
export function HoldingRequiredReturnPart({
  holding,
}: {
  holding: AnalysisHolding;
}): ReactNode {
  return (
    <CalculationPart
      title={m.measures_required_return_label()}
      level={3}
      row={{
        label: m.measures_required_return_label(),
        value: formatPercent(holding.requiredReturn.value, "two"),
        description: requiredReturnFormulaText(),
        formula: (
          <RequiredReturnFormula of="i" required={holding.requiredReturn} />
        ),
      }}
    />
  );
}
