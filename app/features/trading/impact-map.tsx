import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
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
import { beta, marketBeta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { formatBeta, formatPercent } from "~/formatting";
import { pathWithQuery } from "~/path-with-query";
import { m } from "~/paraglide/messages.js";
import styles from "./trade-impact.module.css";

export function ImpactMap({
  impact,
  code,
  labelledBy,
  axis = defaultAnalysisAxis,
}: {
  impact: TradeImpact;
  code: string;
  labelledBy: string;
  axis?: AnalysisAxis | undefined;
}): ReactNode {
  const location = useLocation();
  const axisLabels: Record<AnalysisAxis, string> = {
    beta: m.trading_impact_beta_label(),
    risk: m.trading_impact_deviation_label(),
  };
  const { before, after } = impact;
  const traded = before.holdings.find((holding) => holding.code === code);
  if (traded === undefined)
    throw new Error(`The impact measures lack ${code}.`);
  const graph = <Across extends number>(
    risks: { before: Across; after: Across; stock: Across; market: Across },
    across: Parameters<typeof RiskMap<Across, MonthlyReturn>>[0]["across"],
  ) => {
    const point = (
      key: string,
      name: string,
      { risk, expected }: { risk: Across; expected: MonthlyReturn },
    ): MapPoint<Across, MonthlyReturn> => ({
      key,
      name,
      across: risk,
      up: expected,
      values: [
        {
          name: axisLabels[axis],
          value:
            axis === "beta"
              ? formatBeta(beta(risk))
              : formatPercent(risk, "two"),
        },
        {
          name: m.trading_impact_return_label(),
          value: formatPercent(expected, "two"),
        },
      ],
    });
    const points: MarkedPoint<Across, MonthlyReturn>[] = [
      {
        ...point("before", m.trading_impact_before_label(), {
          risk: risks.before,
          expected: before.expectedReturn.value,
        }),
        mark: { kind: "before" },
        arrowTo: "after",
      },
      {
        ...point("after", m.trading_impact_after_label(), {
          risk: risks.after,
          expected: after.expectedReturn.value,
        }),
        mark: { kind: "own" },
      },
      {
        ...point(code, code, {
          risk: risks.stock,
          expected: traded.expectedReturn.value,
        }),
        mark: { kind: "held", weight: undefined },
      },
    ];
    return (
      <RiskMap
        compact
        points={points}
        market={point(marketIndex.code, marketIndex.code, {
          risk: risks.market,
          expected: before.market.expectedReturn.value,
        })}
        across={across}
        up={{ style: "percent", toValue: monthlyReturn }}
        {...(axis === "beta"
          ? {
              line: {
                name: m.trading_impact_sml_label(),
                start: {
                  across: across.toValue(0),
                  up: before.market.riskFreeRate.value,
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
      graph(
        {
          before: before.beta.value,
          after: after.beta.value,
          stock: traded.beta.value,
          market: marketBeta,
        },
        { style: "decimal", toValue: beta, title: axisLabels.beta },
      ),
    risk: () =>
      graph(
        {
          before: before.standardDeviation.value,
          after: after.standardDeviation.value,
          stock: traded.standardDeviation.value,
          market: before.market.standardDeviation.value,
        },
        {
          style: "percent",
          toValue: monthlyReturn,
          title: m.trading_impact_risk_label(),
        },
      ),
  };
  return (
    <div className={styles["map"]}>
      <RiskMapLegend
        items={[
          { kind: "before", name: m.trading_impact_before_label() },
          { kind: "own", name: m.trading_impact_after_label() },
          { kind: "held", name: code },
          { kind: "market", name: marketIndex.code },
        ]}
      />
      <div
        className={styles["segments"]}
        role="group"
        aria-label={m.trading_impact_axis_label()}
      >
        {analysisAxes.map((value) => (
          <Link
            key={value}
            to={pathWithQuery(`${location.pathname}${location.search}`, {
              impactAxis: value,
            })}
            preventScrollReset
            aria-current={axis === value ? "true" : undefined}
          >
            <span>{axisLabels[value]}</span>
          </Link>
        ))}
      </div>
      {graphs[axis]()}
    </div>
  );
}
