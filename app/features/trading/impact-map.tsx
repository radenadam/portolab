import type { ReactNode } from "react";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import type { MarkedPoint, MapPoint } from "~/charts/layout-risk-map";
import {
  analysisAxes,
  defaultAnalysisAxis,
} from "~/features/measures/analysis-axes";
import type { AnalysisAxis } from "~/features/measures/analysis-axes";
import type { TradeImpact } from "~/features/measures/measure-trade";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "./trade-impact.module.css";
import { impactPointValues } from "./impact-point-values";
import { ImpactChoices } from "./impact-choices";

export function ImpactMap({
  impact,
  code,
  labelledBy,
  axis = defaultAnalysisAxis,
  anchor,
}: {
  impact: TradeImpact;
  code: string;
  labelledBy: string;
  axis?: AnalysisAxis | undefined;
  anchor: "impact" | "ticket-impact";
}): ReactNode {
  const axisLabels: Record<AnalysisAxis, string> = {
    beta: m.trading_impact_beta_label(),
    risk: m.trading_impact_deviation_label(),
  };
  const controlLabels: Record<typeof anchor, string> = {
    impact: m.trading_impact_axis_label(),
    "ticket-impact": m.trading_impact_ticket_axis_label(),
  };
  const values = impactPointValues(impact, code);
  type Point = (typeof values)[keyof typeof values];
  const graph = <Across extends number>(
    riskOf: (point: Point) => Across,
    across: Parameters<typeof RiskMap<Across, MonthlyReturn>>[0]["across"],
  ) => {
    const point = (value: Point): MapPoint<Across, MonthlyReturn> => ({
      key: value.key,
      name: value.name,
      across: riskOf(value),
      up: value.expected,
      values: [
        {
          name: axisLabels[axis],
          value:
            axis === "beta"
              ? formatBeta(value.beta)
              : formatPercent(value.risk, "two"),
        },
        {
          name: m.trading_impact_return_label(),
          value: formatPercent(value.expected, "two"),
        },
      ],
    });
    const points: MarkedPoint<Across, MonthlyReturn>[] = [
      {
        ...point(values.before),
        mark: { kind: "before" },
        arrowTo: "after",
      },
      {
        ...point(values.after),
        mark: { kind: "own" },
      },
      {
        ...point(values.stock),
        mark: { kind: "held", weight: undefined },
      },
    ];
    return (
      <RiskMap
        compact
        short
        points={points}
        market={point(values.market)}
        across={across}
        up={{ style: "percent", toValue: monthlyReturn }}
        {...(axis === "beta"
          ? {
              line: {
                name: m.trading_impact_sml_label(),
                start: {
                  across: across.toValue(0),
                  up: impact.before.market.riskFreeRate.value,
                },
              },
            }
          : {})}
        labelledBy={labelledBy}
      />
    );
  };
  const graphs: Record<AnalysisAxis, () => ReactNode> = {
    beta: () =>
      graph((point) => point.beta, {
        style: "decimal",
        toValue: beta,
        title: axisLabels.beta,
      }),
    risk: () =>
      graph((point) => point.risk, {
        style: "percent",
        toValue: monthlyReturn,
        title: m.trading_impact_risk_label(),
      }),
  };
  return (
    <div className={styles["map"]}>
      <div className={styles["mapHead"]}>
        <RiskMapLegend
          items={[
            { kind: "before", name: m.trading_impact_before_label() },
            { kind: "own", name: m.trading_impact_after_label() },
            { kind: "held", name: code },
            { kind: "market", name: marketIndex.code },
          ]}
        />
        <ImpactChoices
          choices={analysisAxes}
          selected={axis}
          label={controlLabels[anchor]}
          name={(value) => axisLabels[value]}
          field="impactAxis"
          anchor={anchor}
        />
      </div>
      {graphs[axis]()}
    </div>
  );
}
