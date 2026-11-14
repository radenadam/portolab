import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import {
  BetaFormula,
  StandardDeviationFormula,
} from "~/features/measures/formulas";
import {
  measureConcept,
  measureUnitText,
} from "~/features/measures/measure-concept";
import { monthSpanInputs } from "~/features/measures/month-span";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { readMarket } from "./read-market.server";

type Reference = ReturnType<typeof readMarket>["marketReference"];

/** The column's reference supplies an example without choosing a stock for the reader. */
export function MarketMeasureHelp({
  kind,
  reference,
  index,
}: {
  kind: "beta" | "risk";
  reference: Reference;
  index: string;
}): ReactNode {
  const concept = measureConcept(kind);
  const title = {
    beta: m.market_data_beta_label(),
    risk: m.market_data_volatility_label(),
  }[kind];
  let value: ReactNode;
  let calculation: ReactNode;
  const unit = measureUnitText(kind);
  if (!reference.ok) {
    value = reference.failure;
  } else {
    const market = reference.value;
    switch (kind) {
      case "beta":
        value = formatBeta(market.beta.value);
        calculation = <BetaFormula beta={market.beta} />;
        break;
      case "risk":
        value = formatPercent(market.standardDeviation, "two");
        calculation = (
          <StandardDeviationFormula of="M" variance={market.variance} />
        );
    }
  }
  return (
    <ConceptCard
      title={title}
      meaning={concept.meaning}
      lesson={<ConceptLesson termId={concept.termId} />}
      example={
        <>
          <p>
            {reference.ok && index} <strong>{value}</strong>
          </p>
          {reference.ok && (
            <>
              {unit !== undefined && <p>{unit}</p>}
              <p>
                {m.market_data_period_notice(
                  monthSpanInputs(reference.value.months),
                )}
              </p>
            </>
          )}
        </>
      }
      calculation={calculation}
    />
  );
}
