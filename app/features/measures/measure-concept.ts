import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";

export type MeasureConcept =
  | "beta"
  | "risk"
  | "expectedReturn"
  | "sharpe"
  | "treynor"
  | "alpha"
  | "riskFree"
  | "market";

/** The approved cards map each concept to its lesson, so screen pieces share that mapping. */
export function measureConcept(concept: MeasureConcept): {
  meaning: string;
  session: number;
} {
  const concepts: Record<MeasureConcept, { meaning: string; session: number }> =
    {
      beta: {
        meaning: m.measures_beta_concept_body({ index: marketIndex.code }),
        session: 9,
      },
      risk: { meaning: m.measures_risk_concept_body(), session: 10 },
      expectedReturn: {
        meaning: m.measures_return_concept_body(),
        session: 10,
      },
      sharpe: { meaning: m.measures_sharpe_concept_body(), session: 10 },
      treynor: { meaning: m.measures_treynor_concept_body(), session: 10 },
      alpha: { meaning: m.measures_alpha_concept_body(), session: 9 },
      riskFree: { meaning: m.measures_risk_free_concept_body(), session: 9 },
      market: { meaning: m.measures_market_concept_body(), session: 4 },
    };
  return concepts[concept];
}
