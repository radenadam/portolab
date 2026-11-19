import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import type { ChangeDirection } from "~/formatting";
import { formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { ReturnMeasure } from "./aligned-returns";
import type { RequiredReturnMeasure, SecurityMarketLineMeasure } from "./capm";
import { MarketLineFormula, RequiredReturnFormula } from "./capm-formulas";
import { requiredReturnFormulaText } from "./formula-texts";
import type { Subject } from "./formulas";
import { measureConcept, measureUnitText } from "./measure-concept";
import type { MeasureConcept } from "./measure-concept";
import styles from "./measures.module.css";
import { monthSpanInputs, monthSpanOf } from "./month-span";

/** A measure as every list and card of measures shows it, in this order: its name, its value beside the name, the sentence that says what its formula computes, and its formula with its numbers where the data gives them. */
export interface MeasureRow {
  label: string;
  value: ReactNode;
  /** One sentence that says what the formula computes, from which values. */
  description: string;
  formula: ReactNode;
  calculation?: ReactNode;
  concept?: MeasureConcept;
  inputs?: ReactNode;
  example?: ReactNode;
}

/** A list of measures, each a block of the parts of MeasureRow in their order, so every measure reads alike. The blocks stand side by side where the screen has room, and the parts of the blocks of one line start at the same height. */
export function MeasureList({
  rows,
}: {
  rows: readonly MeasureRow[];
}): ReactNode {
  return (
    <dl className={styles["measures"]}>
      {rows.map((row) => (
        <div key={row.label} className={styles["measure"]}>
          <dt>
            <MeasureLabel row={row} />
          </dt>
          <dd className={styles["value"]}>
            <NumberText whole>{row.value}</NumberText>
          </dd>
          <dd className={styles["description"]}>
            <NumberText>{row.description}</NumberText>
          </dd>
          <dd className={styles["formula"]}>{row.formula}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The summary and the full list share a label so their help cannot differ. */
export function MeasureLabel({
  row,
  hideText = false,
}: {
  row: MeasureRow;
  hideText?: boolean;
}): ReactNode {
  const concept =
    row.concept === undefined ? undefined : measureConcept(row.concept);
  const unit =
    row.concept === undefined ? undefined : measureUnitText(row.concept);
  const label = <NumberText>{row.label}</NumberText>;
  return (
    <>
      {hideText ? <span aria-hidden>{label}</span> : label}
      {concept !== undefined && (
        <ConceptCard
          title={row.label}
          meaning={concept.meaning}
          lesson={<ConceptLesson termId={concept.termId} />}
          example={
            row.example ?? (
              <>
                <p>
                  <strong>
                    <NumberText whole>{row.value}</NumberText>
                  </strong>
                </p>
                {unit !== undefined && <p>{unit}</p>}
              </>
            )
          }
          calculation={
            <>
              <p>
                <NumberText>{row.description}</NumberText>
              </p>
              <p>{row.calculation ?? row.formula}</p>
              {row.inputs}
            </>
          }
        />
      )}
    </>
  );
}

/** The rows of the return that CAPM requires for a beta and of the distance of the expected return from the security market line, which a stock and a portfolio share. */
export function capmRows(
  of: Subject,
  measures: {
    requiredReturn: RequiredReturnMeasure;
    securityMarketLine: SecurityMarketLineMeasure;
  },
  { colored = false }: { colored?: boolean } = {},
): MeasureRow[] {
  return [
    {
      label: m.measures_required_return_label(),
      value: formatPercent(measures.requiredReturn.value, "two"),
      description: requiredReturnFormulaText(),
      formula: (
        <RequiredReturnFormula of={of} required={measures.requiredReturn} />
      ),
    },
    {
      label: m.measures_market_line_label(),
      concept: "alpha",
      description: m.measures_alpha_formula_notice(),
      value: (
        <ChangeText
          colored={colored}
          change={formatSignedPercent(measures.securityMarketLine.value)}
        />
      ),
      formula: (
        <MarketLineFormula of={of} distance={measures.securityMarketLine} />
      ),
    },
  ];
}

const positions: Record<ChangeDirection, () => string> = {
  rise: m.measures_above_line_notice,
  fall: m.measures_below_line_notice,
  none: m.measures_on_line_notice,
};

/** Where an expected return lies against the security market line, from the sign that its distance shows, so the sentence never disagrees with the rounded distance. */
export function MarketLinePosition({
  distance,
}: {
  distance: MonthlyReturn;
}): ReactNode {
  return (
    <p>
      <NumberText>
        {positions[formatSignedPercent(distance).direction]()}
      </NumberText>
    </p>
  );
}

/** The number of monthly returns that measures use and the months of the first and the last of them. */
export function MonthsNotice({
  returns,
}: {
  returns: readonly ReturnMeasure[];
}): ReactNode {
  return (
    <p>
      <NumberText>
        {m.measures_months_notice(monthSpanInputs(monthSpanOf(returns)))}
      </NumberText>
    </p>
  );
}
