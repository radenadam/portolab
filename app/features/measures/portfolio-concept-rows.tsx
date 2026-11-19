import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { StandardDeviationFormula } from "./formulas";
import { WeightedSumFormula } from "./portfolio-formulas";
import type { MeasureRow } from "./measure-list";
import type { PortfolioSummary } from "./measure-summaries";
import { HoldingTable } from "./portfolio-tables";

/** The concepts shared by the summary and the analysis of a portfolio, so both show the same values and inputs. */
export function portfolioConceptRows(
  portfolio: PortfolioSummary,
  reader: PortfolioReader,
): Record<"expectedReturn" | "risk" | "beta", MeasureRow> {
  const index = marketIndex.code;
  return {
    expectedReturn: {
      label: m.measures_expected_return_label(),
      concept: "expectedReturn",
      inputs: (
        <HoldingTable
          portfolio={portfolio}
          reader={reader}
          measure="expectedReturn"
        />
      ),
      value: formatPercent(portfolio.expectedReturn, "two"),
      description: m.measures_weighted_return_formula_notice(),
      formula: (
        <WeightedSumFormula
          measure="expectedReturn"
          terms={portfolio.holdings.map((holding) => ({
            code: holding.code,
            weight: holding.weight,
            kind: "expectedReturn",
            value: holding.expectedReturn,
          }))}
        />
      ),
    },
    risk: {
      label: m.measures_standard_deviation_label(),
      concept: "risk",
      value: formatPercent(portfolio.standardDeviation, "two"),
      description: m.measures_standard_deviation_formula_notice(),
      formula: (
        <StandardDeviationFormula of="p" variance={portfolio.variance} />
      ),
    },
    beta: {
      label: m.measures_beta_label({ index }),
      concept: "beta",
      inputs: (
        <HoldingTable portfolio={portfolio} reader={reader} measure="beta" />
      ),
      value: formatBeta(portfolio.beta),
      description: m.measures_weighted_beta_formula_notice(),
      formula: (
        <WeightedSumFormula
          measure="beta"
          terms={portfolio.holdings.map((holding) => ({
            code: holding.code,
            weight: holding.weight,
            kind: "beta",
            value: holding.beta,
          }))}
        />
      ),
    },
  };
}
