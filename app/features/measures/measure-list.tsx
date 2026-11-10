import { Fragment } from "react";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import definitionStyles from "~/definition-list.module.css";
import type { ChangeDirection } from "~/formatting";
import { formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { ReturnMeasure } from "./aligned-returns";
import type { RequiredReturnMeasure, SecurityMarketLineMeasure } from "./capm";
import { MarketLineFormula, RequiredReturnFormula } from "./formulas";
import type { Subject } from "./formulas";
import styles from "./measures.module.css";
import { monthSpanInputs, monthSpanOf } from "./month-span";

/** A measure as a list of measures shows it: its name, its value, and its formula with its inputs. */
export interface MeasureRow {
  label: string;
  value: ReactNode;
  formula: ReactNode;
}

/** A list of measures, each with its name and its value, and below them its formula with its inputs. */
export function MeasureList({
  rows,
}: {
  rows: readonly MeasureRow[];
}): ReactNode {
  return (
    <dl className={[definitionStyles["list"], styles["measures"]].join(" ")}>
      {rows.map((row) => (
        <Fragment key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
          <dd className={styles["formula"]}>{row.formula}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** The rows of the return that CAPM requires for a beta and of the distance of the expected return from the security market line, which a stock and a portfolio share. */
export function capmRows(
  of: Subject,
  measures: {
    requiredReturn: RequiredReturnMeasure;
    securityMarketLine: SecurityMarketLineMeasure;
  },
): MeasureRow[] {
  return [
    {
      label: m.measures_required_return_label(),
      value: formatPercent(measures.requiredReturn.value, "two"),
      formula: (
        <RequiredReturnFormula of={of} required={measures.requiredReturn} />
      ),
    },
    {
      label: m.measures_market_line_label(),
      value: (
        <ChangeText
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
  return <p>{positions[formatSignedPercent(distance).direction]()}</p>;
}

/** The number of monthly returns that measures use and the months of the first and the last of them. */
export function MonthsNotice({
  returns,
}: {
  returns: readonly ReturnMeasure[];
}): ReactNode {
  return (
    <p>{m.measures_months_notice(monthSpanInputs(monthSpanOf(returns)))}</p>
  );
}
