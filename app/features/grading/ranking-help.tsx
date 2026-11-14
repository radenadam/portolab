import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { MarketLineFormula } from "~/features/measures/capm-formulas";
import { measureConcept } from "~/features/measures/measure-concept";
import {
  SharpeRatioFormula,
  TreynorRatioFormula,
} from "~/features/measures/ratio-formulas";
import type { ComparedMeasures } from "./compared-measures";
import { rankingLabel, rankingText, rankingValue } from "./ranking-measure";
import type { RankingMeasure } from "./ranking-measure";
import type { ComparedStudent } from "./student-filters";

export function RankingHelp({
  student,
  measure,
}: {
  student: ComparedStudent | undefined;
  measure: RankingMeasure;
}): ReactNode {
  if (student === undefined || !("measures" in student)) return null;
  const concept = measureConcept(measure);
  const value = rankingValue(student, measure);
  return (
    <ConceptCard
      title={rankingLabel(measure)}
      meaning={concept.meaning}
      example={
        <p>
          <NumberText verbatim>{student.name}</NumberText>{" "}
          <NumberText>
            {value.ok ? rankingText(student.measures, measure) : value.failure}
          </NumberText>
        </p>
      }
      calculation={
        <RankingFormula measures={student.measures} measure={measure} />
      }
      lesson={<ConceptLesson termId={concept.termId} />}
    />
  );
}

function RankingFormula({
  measures,
  measure,
}: {
  measures: ComparedMeasures;
  measure: RankingMeasure;
}): ReactNode {
  switch (measure) {
    case "alpha":
      return (
        <MarketLineFormula
          of="p"
          distance={{
            formula: "securityMarketLineDistance",
            value: measures.distance,
            inputs: {
              expectedReturn: measures.expectedReturn,
              requiredReturn: measures.requiredReturn,
            },
          }}
        />
      );
    case "sharpe":
      return (
        <SharpeRatioFormula
          inputs={{
            expectedReturn: measures.expectedReturn,
            riskFreeRate: measures.riskFreeRate,
            standardDeviation: measures.standardDeviation,
          }}
        />
      );
    case "treynor":
      return (
        <TreynorRatioFormula
          inputs={{
            expectedReturn: measures.expectedReturn,
            riskFreeRate: measures.riskFreeRate,
            beta: measures.beta,
          }}
        />
      );
  }
}
