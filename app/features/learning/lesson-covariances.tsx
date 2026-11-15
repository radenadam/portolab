import type { ReactNode } from "react";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import {
  Operand,
  PortfolioVarianceFormula,
} from "~/features/measures/formulas";
import { formatCorrelation, formatPercent, formatVariance } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { weightedCovariance } from "~/features/measures/weighted-covariance";
import styles from "./lesson-practice.module.css";

export function LessonCovariances({
  portfolio,
  weights,
  variance,
}: {
  portfolio: PortfolioSummary;
  weights: readonly { code: string; weight: PortfolioWeight }[];
  variance: MonthlyVariance;
}): ReactNode {
  const terms = portfolio.pairs.map((pair) => {
    const first = weights.find((holding) => holding.code === pair.first);
    const second = weights.find((holding) => holding.code === pair.second);
    if (first === undefined || second === undefined)
      throw new Error(
        `The allocation has no weights for ${pair.first} and ${pair.second}.`,
      );
    return {
      ...pair,
      firstWeight: first.weight,
      secondWeight: second.weight,
      term: weightedCovariance(first.weight, second.weight, pair.covariance),
    };
  });
  const maximum = Math.max(
    ...terms.map((term) => Math.abs(term.term)),
    Number.EPSILON,
  );
  return (
    <details className={styles["covariances"]}>
      <summary>{m.learning_covariances_title()}</summary>
      <p>
        <PortfolioVarianceFormula /> ={" "}
        <NumberText>{formatVariance(variance)}</NumberText>
      </p>
      <div className={styles["matrix"]}>
        {terms.map((pair) => (
          <div
            key={`${pair.first}-${pair.second}`}
            className={styles["cell"]}
            style={{
              background: `color-mix(in oklab, var(--color-data) ${String((Math.abs(pair.term) / maximum) * 15)}%, var(--color-panel))`,
            }}
          >
            <strong className={styles["code"]}>
              {pair.first} · {pair.second}
            </strong>
            <span>
              ρ <NumberText>{formatCorrelation(pair.correlation)}</NumberText>
            </span>
            <span>
              <NumberText>{formatPercent(pair.firstWeight, "two")}</NumberText>{" "}
              <Operand
                value={pair.secondWeight}
                text={formatPercent(pair.secondWeight, "two")}
                operator="×"
              />{" "}
              <Operand
                value={pair.covariance}
                text={formatVariance(pair.covariance)}
                operator="×"
              />{" "}
              = <NumberText>{formatVariance(pair.term)}</NumberText>
            </span>
          </div>
        ))}
      </div>
      <p className={styles["muted"]}>{m.learning_covariances_notice()}</p>
    </details>
  );
}
