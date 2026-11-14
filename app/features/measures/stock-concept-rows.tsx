import { stockComparisonText } from "./stock-comparison-text";
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
): Record<
  "expectedReturn" | "risk" | "beta",
  MeasureRow & { comparison: string; statisticLabel: string }
> {
  return {
    expectedReturn: {
      label: m.measures_expected_return_label(),
      concept: "expectedReturn",
      statisticLabel: m.measures_stock_expected_return_label(),
      comparison: m.measures_market_comparison_notice({
        index: marketIndex.code,
        value: formatPercent(stock.market.expectedReturn, "two"),
      }),
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
      statisticLabel: m.measures_stock_volatility_label(),
      comparison: m.measures_market_comparison_notice({
        index: marketIndex.code,
        value: formatPercent(stock.market.standardDeviation, "two"),
      }),
      value: formatPercent(stock.standardDeviation, "two"),
      formula: <StandardDeviationFormula of="i" variance={stock.variance} />,
    },
    beta: {
      label: m.measures_beta_label({ index: marketIndex.code }),
      concept: "beta",
      statisticLabel: m.measures_stock_beta_label(),
      comparison: stockComparisonText({
        kind: "beta",
        value: stock.beta.value,
      }),
      value: formatBeta(stock.beta.value),
      formula: <BetaFormula beta={stock.beta} />,
    },
  };
}
