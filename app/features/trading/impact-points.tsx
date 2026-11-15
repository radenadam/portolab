import type { ReactNode } from "react";
import type { TradeImpact } from "~/features/measures/measure-trade";
import { SecurityMarketLineFormula } from "~/features/measures/capm-formulas";
import { MeasureTable } from "~/features/measures/measure-table";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatBeta, formatPercent } from "~/formatting";
import { marketBeta } from "~/units/beta";
import { m } from "~/paraglide/messages.js";
import styles from "./trade-impact.module.css";

/** The point values remain available to assistive technology before the map gains its slider. */
export function ImpactPoints({
  impact,
  code,
}: {
  impact: TradeImpact;
  code: string;
}): ReactNode {
  const { before, after } = impact;
  const stock = before.holdings.find((holding) => holding.code === code);
  if (stock === undefined) throw new Error(`The impact measures lack ${code}.`);
  const points = [
    {
      name: m.trading_impact_before_label(),
      beta: before.beta.value,
      risk: before.standardDeviation.value,
      expected: before.expectedReturn.value,
    },
    {
      name: m.trading_impact_after_label(),
      beta: after.beta.value,
      risk: after.standardDeviation.value,
      expected: after.expectedReturn.value,
    },
    {
      name: code,
      beta: stock.beta.value,
      risk: stock.standardDeviation.value,
      expected: stock.expectedReturn.value,
    },
    {
      name: marketIndex.code,
      beta: marketBeta,
      risk: before.market.standardDeviation.value,
      expected: before.market.expectedReturn.value,
    },
  ];
  return (
    <details className={styles["points"]}>
      <summary>{m.trading_impact_points_label()}</summary>
      <p>
        <SecurityMarketLineFormula
          line={{
            riskFreeRate: before.market.riskFreeRate.value,
            marketExpectedReturn: before.market.expectedReturn.value,
          }}
        />
      </p>
      <MeasureTable
        header={[
          m.trading_impact_point_label(),
          m.trading_impact_beta_label(),
          m.trading_impact_risk_label(),
          m.trading_impact_return_label(),
        ]}
        rows={points.map((point) => ({
          key: point.name,
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
