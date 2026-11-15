import type { ReactNode } from "react";
import type { ConceptTermId } from "~/features/learning/concept-term-ids";
import { m } from "~/paraglide/messages.js";
import type { AnalysisAxis } from "./analysis-axes";
import {
  analysisAlphaInsight,
  analysisDiversificationInsight,
} from "./analysis-insight";
import type { AnalysisInsight } from "./analysis-insight";
import { SecurityMarketLineFormula } from "./capm-formulas";
import { measureConcept } from "./measure-concept";
import type { MarketSummary, PortfolioSummary } from "./measure-summaries";
import { weightedHoldingRisk } from "./weighted-holding-risk";

interface AxisDetails {
  title: string;
  label: string;
  termId: ConceptTermId;
  meaning: string;
  insight: (portfolio: PortfolioSummary) => AnalysisInsight;
  calculation: (market: MarketSummary) => ReactNode;
  sessionLabel: (inputs: { session: string }) => string;
}

export function analysisAxisDetails(axis: AnalysisAxis): AxisDetails {
  const details: Record<AnalysisAxis, AxisDetails> = {
    beta: {
      title: m.measures_line_title(),
      label: m.measures_analysis_beta_label(),
      termId: "alpha-jensen",
      meaning: measureConcept("alpha").meaning,
      insight: (portfolio) =>
        analysisAlphaInsight(portfolio.securityMarketLine.value),
      calculation: (market) => (
        <SecurityMarketLineFormula
          line={{
            riskFreeRate: market.riskFreeRate.value,
            marketExpectedReturn: market.expectedReturn,
          }}
        />
      ),
      sessionLabel: m.measures_analysis_capm_session_label,
    },
    risk: {
      title: m.measures_analysis_total_risk_title(),
      label: m.measures_standard_deviation_label(),
      termId: "diversifikasi",
      meaning: m.measures_analysis_diversification_body(),
      insight: (portfolio) =>
        analysisDiversificationInsight(
          weightedHoldingRisk(portfolio),
          portfolio.standardDeviation,
        ),
      calculation: () => <p>{m.measures_analysis_average_formula_notice()}</p>,
      sessionLabel: m.measures_analysis_diversification_session_label,
    },
  };
  return details[axis];
}
