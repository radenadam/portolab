import { formatBeta, formatPercent } from "~/formatting";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";
import { BetaFormula, MeanFormula, StandardDeviationFormula } from "./formulas";
import type { MeasureRow } from "./measure-list";
import type { StockSummary } from "./measure-summaries";
import { ReturnTables } from "./return-tables";

/** One definition keeps the summary and the full calculation from showing different help. */
export function stockConceptRows(
  stock: StockSummary,
): Record<"expectedReturn" | "risk" | "beta", MeasureRow> {
  return {
    expectedReturn: {
      label: m.measures_expected_return_label(),
      concept: "expectedReturn",
      inputs: (
        <ReturnTables
          showHeading={false}
          instruments={[{ code: stock.code, returns: stock.returns }]}
        />
      ),
      value: formatPercent(stock.expectedReturn, "two"),
      formula: <MeanFormula of="i" count={stock.returns.length} />,
    },
    risk: {
      label: m.measures_standard_deviation_label(),
      concept: "risk",
      value: formatPercent(stock.standardDeviation, "two"),
      formula: <StandardDeviationFormula of="i" variance={stock.variance} />,
    },
    beta: {
      label: m.measures_beta_label({ index: marketIndex.code }),
      concept: "beta",
      value: formatBeta(stock.beta.value),
      formula: <BetaFormula beta={stock.beta} />,
    },
  };
}
