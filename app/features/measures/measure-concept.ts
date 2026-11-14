import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { ConceptTermId } from "~/features/learning/concept-term-ids";
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

interface ConceptDefinition {
  meaning: string;
  termId: ConceptTermId;
  monthly: boolean;
}

/** Every concept states its units and glossary term so a new concept cannot inherit another concept's choices. */
export function measureConcept(concept: MeasureConcept): ConceptDefinition {
  const concepts: Record<MeasureConcept, ConceptDefinition> = {
    beta: {
      meaning: m.measures_beta_concept_body({ index: marketIndex.code }),
      termId: "beta",
      monthly: false,
    },
    risk: {
      meaning: m.measures_risk_concept_body(),
      termId: "simpangan-baku",
      monthly: true,
    },
    expectedReturn: {
      meaning: m.measures_return_concept_body(),
      termId: "imbal-hasil-harapan",
      monthly: true,
    },
    sharpe: {
      meaning: m.measures_sharpe_concept_body(),
      termId: "rasio-sharpe",
      monthly: false,
    },
    treynor: {
      meaning: m.measures_treynor_concept_body(),
      termId: "rasio-treynor",
      monthly: true,
    },
    alpha: {
      meaning: m.measures_alpha_concept_body(),
      termId: "alpha-jensen",
      monthly: true,
    },
    riskFree: {
      meaning: m.measures_risk_free_concept_body(),
      termId: "bi-rate",
      monthly: true,
    },
    market: {
      meaning: m.measures_market_concept_body({ index: marketIndex.code }),
      termId: "ihsg",
      monthly: true,
    },
  };
  return concepts[concept];
}
