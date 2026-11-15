import type { ReactNode } from "react";
import type {
  HoldingRiskSummary,
  PortfolioSummary,
} from "~/features/measures/measure-summaries";
import type { MonthlyReturn } from "~/units/monthly-return";
import { formatPercent, smallestPercentStep } from "~/formatting";
import { monthlyReturn } from "~/units/monthly-return";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { PracticePanel } from "./practice-panel";
import { riskMeasureFailureText } from "~/features/measures/measure-failure-text";
import { practiceRiskTarget } from "./practice-risk-target";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import styles from "./lesson-practice.module.css";

export function LessonRiskPractice({
  portfolio,
  current,
}: {
  portfolio: PortfolioSummary;
  current: MonthlyReturn;
}): ReactNode {
  const risks = portfolio.holdingRisks;
  const rows = risks.ok
    ? risks.value.toSorted(
        (first, second) => second.varianceShare - first.varianceShare,
      )
    : [];
  const proportionalTarget = monthlyReturn(
    portfolio.standardDeviation * practiceRiskTarget,
  );
  const lowerRisk =
    formatPercent(proportionalTarget, "two") !==
    formatPercent(monthlyReturn(0), "two");
  const target = lowerRisk
    ? proportionalTarget
    : monthlyReturn(smallestPercentStep);
  const currentText = formatPercent(current, "two");
  const targetText = formatPercent(target, "two");
  const done =
    (lowerRisk ? current < target : current > target) &&
    currentText !== targetText;
  const minimum = Math.min(0, ...rows.map((row) => row.varianceShare));
  const maximum = Math.max(1, ...rows.map((row) => row.varianceShare));
  const position = (value: number): string =>
    percentOf(plotFraction((value - minimum) / (maximum - minimum)));
  return (
    <PracticePanel>
      {risks.ok ? (
        <>
          <p className={styles["muted"]}>{m.learning_risk_practice_notice()}</p>
          <div>
            {rows.map((row) => (
              <div key={row.code} className={styles["pair"]}>
                <span className={styles["code"]}>{row.code}</span>
                <span className={styles["contribution"]} aria-hidden="true">
                  <i
                    style={{
                      left: position(Math.min(0, row.varianceShare)),
                      width: percentOf(
                        plotFraction(
                          Math.abs(row.varianceShare) / (maximum - minimum),
                        ),
                      ),
                    }}
                  />
                  <em style={{ left: position(0) }} />
                  <b style={{ left: position(row.weight) }} />
                </span>
                <NumberText whole>
                  {formatPercent(row.varianceShare, "two")} /{" "}
                  {formatPercent(row.weight, "two")}
                </NumberText>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>
          <NumberText>{riskMeasureFailureText(risks.failure)}</NumberText>
        </p>
      )}
      <div className={styles["task"]}>
        <p>
          <strong>{m.learning_task_label()}</strong>{" "}
          <NumberText>
            {lowerRisk
              ? lowerRiskTask(rows, {
                  target: targetText,
                  current: currentText,
                })
              : m.learning_zero_risk_task_notice({
                  target: targetText,
                  current: currentText,
                })}
          </NumberText>
        </p>
        <p role="status" data-complete={done}>
          {done
            ? m.learning_risk_done_notice()
            : m.learning_risk_pending_notice()}
        </p>
      </div>
    </PracticePanel>
  );
}

function lowerRiskTask(
  rows: readonly HoldingRiskSummary[],
  values: { target: string; current: string },
): string {
  const first = rows[0];
  if (first === undefined)
    throw new Error(
      "A portfolio with positive risk has no holding risk share.",
    );
  return m.learning_risk_task_notice({ ...values, code: first.code });
}
