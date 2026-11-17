import mapStyles from "~/charts/risk-map.module.css";
import { useMemo } from "react";
import { MapLabel } from "~/charts/map-label";
import { useMapLabels } from "~/charts/use-map-labels";
import type { MapLabels } from "~/charts/map-labels";
import {
  layoutTwoStockCurve,
  twoStockMarkRadii,
  twoStockPortfolioKey,
} from "./layout-two-stock-curve";
import type { TwoStockPointKind } from "./layout-two-stock-curve";
import type { ReactNode } from "react";
import { niceTicks } from "~/charts/scale";
import { percentOf } from "~/charts/plot";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Correlation } from "~/units/correlation";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import type { MonthlyReturn } from "~/units/monthly-return";
import { monthlyReturn } from "~/units/monthly-return";
import {
  formatPercent,
  formatCorrelation,
  smallestPercentStep,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import styles from "./trading-lesson.module.css";

export function TwoStockCurve({
  portfolio,
  first,
  second,
  weight,
  rho,
  labelledBy,
}: {
  portfolio: PortfolioSummary;
  first: string;
  second: string;
  weight: PortfolioWeight;
  rho: Correlation;
  labelledBy: string;
}): ReactNode {
  const layout = useMemo(
    () => layoutTwoStockCurve(portfolio, { first, second, weight, rho }),
    [portfolio, first, second, weight, rho],
  );
  const { curve, selected, firstPoint, secondPoint, across, up } = layout;
  const portfolioName = m.learning_curve_portfolio_label();
  const labels = useMemo<MapLabels>(
    () => ({
      kept: [
        { key: twoStockPortfolioKey, text: portfolioName },
        { key: first, text: first },
        { key: second, text: second },
      ],
      lines: [],
      others: [],
    }),
    [portfolioName, first, second],
  );
  const returnCharacters = Math.max(
    5,
    ...niceTicks(
      up,
      { count: 4, smallestStep: smallestPercentStep },
      monthlyReturn,
    ).map((tick) => formatPercent(tick).length),
  );
  const { placed, areaRef, drawingRef, measureRef } = useMapLabels(
    labels,
    layout.marks,
    returnCharacters,
  );
  const pointClasses: Record<TwoStockPointKind, string | undefined> = {
    stockPoint: styles["stockPoint"],
    averagePoint: styles["averagePoint"],
    ownPoint: styles["ownPoint"],
  };
  const acrossPosition = (value: MonthlyReturn) =>
    percentOf(layout.acrossPosition(value));
  const upPosition = (value: MonthlyReturn) =>
    percentOf(layout.upPosition(value));
  const point = (
    risk: MonthlyReturn,
    expected: MonthlyReturn,
    detail: { name: string; kind: TwoStockPointKind },
  ) => (
    <g className={pointClasses[detail.kind]}>
      <circle
        cx={acrossPosition(risk)}
        cy={upPosition(expected)}
        r={`${String(twoStockMarkRadii[detail.kind])}em`}
      >
        <title>
          {m.learning_curve_point_label({
            name: detail.name,
            risk: formatPercent(risk, "two"),
            expected: formatPercent(expected, "two"),
          })}
        </title>
      </circle>
    </g>
  );
  return (
    <>
      <div
        className={styles["curve"]}
        data-two-stock-curve
        role="img"
        aria-labelledby={labelledBy}
        aria-label={m.learning_curve_label({
          first,
          second,
          correlation: formatCorrelation(rho),
          risk: formatPercent(selected.standardDeviation.value, "two"),
          expected: formatPercent(selected.expectedReturn.value, "two"),
        })}
      >
        <div ref={areaRef} className={styles["curveArea"]}>
          <svg ref={drawingRef} aria-hidden="true">
            <text x="0%" y="0%" dy="-1.5em">
              {m.learning_return_axis_label()}
            </text>
            {niceTicks(
              across,
              { count: 4, smallestStep: smallestPercentStep },
              monthlyReturn,
            ).map((tick) => (
              <g key={tick}>
                <line
                  x1={acrossPosition(tick)}
                  x2={acrossPosition(tick)}
                  y1="0%"
                  y2="100%"
                  className={styles["grid"]}
                />
                <text
                  x={acrossPosition(tick)}
                  y="100%"
                  dy="1.5em"
                  textAnchor="middle"
                >
                  {formatPercent(tick)}
                </text>
              </g>
            ))}
            {niceTicks(
              up,
              { count: 4, smallestStep: smallestPercentStep },
              monthlyReturn,
            ).map((tick) => (
              <g key={tick}>
                <line
                  x1="0%"
                  x2="100%"
                  y1={upPosition(tick)}
                  y2={upPosition(tick)}
                  className={styles["grid"]}
                />
                <text
                  x="0%"
                  y={upPosition(tick)}
                  dx="-0.5em"
                  dy="0.3em"
                  textAnchor="end"
                >
                  {formatPercent(tick)}
                </text>
              </g>
            ))}
            <line
              x1={acrossPosition(firstPoint.risk)}
              y1={upPosition(firstPoint.expected)}
              x2={acrossPosition(secondPoint.risk)}
              y2={upPosition(secondPoint.expected)}
              className={styles["baseline"]}
            />
            {curve.map((entry, index) => {
              const previous = curve[index - 1];
              return previous === undefined ? null : (
                <line
                  key={entry.weight}
                  x1={acrossPosition(previous.risk)}
                  y1={upPosition(previous.expected)}
                  x2={acrossPosition(entry.risk)}
                  y2={upPosition(entry.expected)}
                  className={styles["combined"]}
                />
              );
            })}
            {point(firstPoint.risk, firstPoint.expected, {
              name: first,
              kind: "stockPoint",
            })}
            {point(secondPoint.risk, secondPoint.expected, {
              name: second,
              kind: "stockPoint",
            })}
            {point(selected.averageRisk, selected.expectedReturn.value, {
              name: m.learning_average_risk_label(),
              kind: "averagePoint",
            })}
            {point(
              selected.standardDeviation.value,
              selected.expectedReturn.value,
              { name: m.learning_portfolio_risk_label(), kind: "ownPoint" },
            )}
            {labels.kept.map((label) => (
              <MapLabel
                key={label.key}
                text={label.text}
                place={placed.points.get(label.key)}
                className={
                  label.key === twoStockPortfolioKey
                    ? styles["portfolioLabel"]
                    : mapStyles["label"]
                }
                kind="point"
              />
            ))}
            <text
              ref={measureRef}
              className={styles["portfolioLabel"]}
              visibility="hidden"
            />
            <text x="100%" y="100%" dy="3em" textAnchor="end">
              {m.learning_risk_axis_label()}
            </text>
          </svg>
        </div>
      </div>
      <div className={styles["legend"]}>
        <span className={styles["legendItem"]}>
          <i className={styles["combined"]} />
          {m.learning_curve_weights_label({
            correlation: formatCorrelation(rho),
          })}
        </span>
        <span className={styles["legendItem"]}>
          <i className={styles["baseline"]} />
          {m.learning_curve_same_label()}
        </span>
      </div>
    </>
  );
}
