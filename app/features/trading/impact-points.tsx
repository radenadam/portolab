import type { ReactNode } from "react";
import type { TradeImpact } from "~/features/measures/measure-trade";
import { SecurityMarketLineFormula } from "~/features/measures/capm-formulas";
import { MeasureTable } from "~/features/measures/measure-table";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { ExplainedFormula } from "~/math-notation";
import { marketLineFormulaText } from "~/features/measures/formula-texts";
import styles from "./trade-impact.module.css";
import { impactPointValues } from "./impact-point-values";

/** The point values remain available to assistive technology before the map gains its slider. */
export function ImpactPoints({
  impact,
  code,
}: {
  impact: TradeImpact;
  code: string;
}): ReactNode {
  const points = Object.values(impactPointValues(impact, code));
  return (
    <details className={styles["points"]}>
      <summary>{m.trading_impact_points_label()}</summary>
      <ExplainedFormula text={marketLineFormulaText()}>
        <SecurityMarketLineFormula
          line={{
            riskFreeRate: impact.before.market.riskFreeRate.value,
            marketExpectedReturn: impact.before.market.expectedReturn.value,
          }}
        />
      </ExplainedFormula>
      <MeasureTable
        header={[
          m.trading_impact_point_label(),
          m.trading_impact_beta_label(),
          m.trading_impact_risk_label(),
          m.trading_impact_return_label(),
        ]}
        rows={points.map((point) => ({
          key: point.key,
          name: point.name,
          cells: {
            kind: "numbers",
            values: [
              formatBeta(point.beta),
              formatPercent(point.risk, "two"),
              formatPercent(point.expected, "two"),
            ],
          },
        }))}
      />
    </details>
  );
}
