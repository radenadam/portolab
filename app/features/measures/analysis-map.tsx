import type { ReactNode } from "react";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import { m } from "~/paraglide/messages.js";
import { beta, marketBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { MapPoint, MarkedPoint } from "~/charts/layout-risk-map";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { MarketSummary, PortfolioSummary } from "./measure-summaries";
import { weightedHoldingRisk } from "./weighted-holding-risk";
import type { AnalysisHolding } from "./analysis-holdings";
import { diversificationChanged } from "./diversification-changed";
import styles from "./analysis.module.css";
import { formatBeta, formatPercent, formatSignedPercent } from "~/formatting";

import type { AnalysisAxis } from "./analysis-axes";

export function AnalysisMap({
  portfolio,
  market,
  holdings,
  axis,
}: {
  portfolio: PortfolioSummary | undefined;
  market: MarketSummary;
  holdings: readonly AnalysisHolding[];
  axis: AnalysisAxis;
}): ReactNode {
  const index = marketIndex.code;
  const betaPoints: MarkedPoint<Beta, MonthlyReturn>[] = holdings.map(
    (holding) => ({
      key: holding.code,
      name: holding.code,
      across: holding.beta,
      up: holding.expectedReturn,
      mark: { kind: "held", weight: holding.weight },
      values: [
        {
          name: m.measures_analysis_beta_label(),
          value: formatBeta(holding.beta),
        },
        {
          name: m.measures_expected_return_label(),
          value: formatPercent(holding.expectedReturn, "two"),
        },
        {
          name: m.measures_market_line_label(),
          value: formatSignedPercent(holding.distance),
        },
      ],
      stem: holding.requiredReturn.value,
      popover: `analysis-stock-${holding.code}-alpha`,
    }),
  );
  if (portfolio !== undefined)
    betaPoints.push({
      key: "portfolio",
      name: m.measures_line_portfolio_label(),
      across: portfolio.beta,
      up: portfolio.expectedReturn,
      mark: { kind: "own" },
      stem: portfolio.requiredReturn.value,
      popover: "analysis-alpha",
      values: [
        {
          name: m.measures_analysis_beta_label(),
          value: formatBeta(portfolio.beta),
        },
        {
          name: m.measures_expected_return_label(),
          value: formatPercent(portfolio.expectedReturn, "two"),
        },
        {
          name: m.measures_market_line_label(),
          value: formatSignedPercent(portfolio.securityMarketLine.value),
        },
      ],
    });
  const levelLabel = m.app_map_value_part({
    name: index,
    value: formatPercent(market.expectedReturn, "two"),
  });
  const marketRisks: Record<AnalysisAxis, { name: string; value: string }> = {
    beta: {
      name: m.measures_analysis_beta_label(),
      value: formatBeta(marketBeta),
    },
    risk: {
      name: m.measures_standard_deviation_label(),
      value: formatPercent(market.standardDeviation, "two"),
    },
  };
  const marketPoint = <Across extends number>(
    across: Across,
  ): MapPoint<Across, MonthlyReturn> => ({
    key: index,
    name: index,
    across,
    up: market.expectedReturn,
    popover: "analysis-market",
    values: [
      marketRisks[axis],
      {
        name: m.measures_expected_return_label(),
        value: formatPercent(market.expectedReturn, "two"),
      },
    ],
  });
  const modeKeys: Record<
    AnalysisAxis,
    Parameters<typeof RiskMapLegend>[0]["items"]
  > = {
    beta: [
      { kind: "line", name: m.measures_line_short_label() },
      { kind: "gain", name: m.measures_analysis_positive_alpha_label() },
      { kind: "loss", name: m.measures_analysis_negative_alpha_label() },
    ],
    risk:
      portfolio === undefined
        ? []
        : [
            {
              kind: "average",
              name: m.measures_analysis_without_diversification_label(),
            },
          ],
  };
  const ownKeys =
    portfolio === undefined
      ? []
      : [{ kind: "own" as const, name: m.measures_line_portfolio_label() }];
  const graphs: Record<AnalysisAxis, ReactNode> = {
    beta: (
      <RiskMap
        fill
        market={marketPoint(marketBeta)}
        points={betaPoints}
        across={{
          style: "decimal",
          toValue: beta,
          title: m.measures_analysis_beta_axis_label({
            market: formatBeta(marketBeta, 1),
          }),
        }}
        up={{ style: "percent", toValue: monthlyReturn }}
        line={{
          name: m.measures_line_short_label(),
          start: { across: beta(0), up: market.riskFreeRate.value },
        }}
        levelLabel={levelLabel}
        labelledBy="analysis-map-title"
      />
    ),
    risk: (
      <RiskMap
        fill
        market={marketPoint(market.standardDeviation)}
        points={deviationPoints(portfolio, holdings)}
        across={{
          style: "percent",
          toValue: monthlyReturn,
          title: m.measures_analysis_risk_axis_label(),
        }}
        up={{ style: "percent", toValue: monthlyReturn }}
        levelLabel={levelLabel}
        labelledBy="analysis-map-title"
      />
    ),
  };
  return (
    <>
      <div className={styles["mapKeys"]}>
        <RiskMapLegend
          items={[
            ...ownKeys,
            ...(holdings.length === 0
              ? []
              : [
                  {
                    kind: "held" as const,
                    name:
                      portfolio === undefined
                        ? m.measures_line_holdings_label()
                        : m.measures_line_weighted_holdings_label(),
                  },
                ]),
            ...modeKeys[axis],
            { kind: "market", name: index },
          ]}
        />
        <p>{m.measures_map_vertical_notice()}</p>
      </div>
      {graphs[axis]}
    </>
  );
}

function deviationPoints(
  portfolio: PortfolioSummary | undefined,
  holdings: readonly AnalysisHolding[],
): MarkedPoint<MonthlyReturn, MonthlyReturn>[] {
  const points: MarkedPoint<MonthlyReturn, MonthlyReturn>[] = holdings.map(
    (holding) => ({
      key: holding.code,
      name: holding.code,
      across: holding.standardDeviation,
      up: holding.expectedReturn,
      mark: { kind: "held", weight: holding.weight },
      popover: `analysis-stock-${holding.code}-risk`,
      values: [
        {
          name: m.measures_standard_deviation_label(),
          value: formatPercent(holding.standardDeviation, "two"),
        },
        {
          name: m.measures_expected_return_label(),
          value: formatPercent(holding.expectedReturn, "two"),
        },
      ],
    }),
  );
  if (portfolio !== undefined)
    points.push(
      {
        key: "average",
        name: m.measures_analysis_without_diversification_label(),
        across: weightedHoldingRisk(portfolio),
        up: portfolio.expectedReturn,
        mark: { kind: "average" },
        ...(diversificationChanged(
          weightedHoldingRisk(portfolio),
          portfolio.standardDeviation,
        )
          ? { arrowTo: "portfolio" }
          : {}),
        popover: "analysis-diversification",
        values: [
          {
            name: m.measures_standard_deviation_label(),
            value: formatPercent(weightedHoldingRisk(portfolio), "two"),
          },
          {
            name: m.measures_expected_return_label(),
            value: formatPercent(portfolio.expectedReturn, "two"),
          },
        ],
      },
      {
        key: "portfolio",
        name: m.measures_line_portfolio_label(),
        across: portfolio.standardDeviation,
        up: portfolio.expectedReturn,
        mark: { kind: "own" },
        popover: "analysis-risk",
        values: [
          {
            name: m.measures_standard_deviation_label(),
            value: formatPercent(portfolio.standardDeviation, "two"),
          },
          {
            name: m.measures_expected_return_label(),
            value: formatPercent(portfolio.expectedReturn, "two"),
          },
        ],
      },
    );
  return points;
}
