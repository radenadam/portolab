import type { ReactNode } from "react";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import type { reweightPortfolio } from "~/features/measures/reweight-portfolio";
import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { SharpeRatio } from "~/units/sharpe-ratio";
import { ChangeText } from "~/change-text";
import {
  formatBeta,
  formatPercent,
  formatSharpeRatio,
  formatSignedPercent,
} from "~/formatting";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import styles from "./lesson-practice.module.css";

interface StatisticValues {
  expectedReturn: MonthlyReturn;
  standardDeviation: MonthlyReturn;
  beta: Beta;
  sharpe: SharpeRatio | undefined;
  treynor: MonthlyReturn | undefined;
  alpha: MonthlyReturn;
}

export function LessonAllocationStatistics({
  measured,
  own,
}: {
  measured: ReturnType<typeof reweightPortfolio>;
  own: PortfolioSummary | undefined;
}): ReactNode {
  const statistics = statisticsOf({
    expectedReturn: measured.expectedReturn.value,
    standardDeviation: measured.standardDeviation.value,
    beta: measured.beta.value,
    sharpe: measured.sharpeRatio.ok
      ? measured.sharpeRatio.value.value
      : undefined,
    treynor: measured.treynorRatio.ok
      ? measured.treynorRatio.value.value
      : undefined,
    alpha: measured.securityMarketLine.value,
  });
  const original =
    own === undefined
      ? undefined
      : statisticsOf({
          expectedReturn: own.expectedReturn,
          standardDeviation: own.standardDeviation,
          beta: own.beta,
          sharpe: own.sharpeRatio.ok ? own.sharpeRatio.value : undefined,
          treynor: own.treynorRatio.ok ? own.treynorRatio.value : undefined,
          alpha: own.securityMarketLine.value,
        });
  return (
    <dl className={styles["statistics"]}>
      {statistics.map(({ label, value }, index) => {
        const comparison = original?.[index];
        return (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              <NumberText whole>{value}</NumberText>
              {comparison !== undefined && (
                <small className={styles["comparison"]}>
                  <Message
                    text={m.learning_current_value_notice}
                    values={{
                      value: <NumberText whole>{comparison.value}</NumberText>,
                    }}
                  />
                </small>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function statisticsOf(
  values: StatisticValues,
): { label: string; value: ReactNode }[] {
  return [
    {
      label: m.learning_expected_return_label(),
      value: formatPercent(values.expectedReturn, "two"),
    },
    {
      label: m.learning_standard_deviation_label(),
      value: formatPercent(values.standardDeviation, "two"),
    },
    {
      label: m.learning_analysis_beta_label(),
      value: formatBeta(values.beta),
    },
    {
      label: m.learning_sharpe_ratio_label(),
      value:
        values.sharpe === undefined
          ? m.learning_no_value_label()
          : formatSharpeRatio(values.sharpe),
    },
    {
      label: m.learning_treynor_ratio_label(),
      value:
        values.treynor === undefined
          ? m.learning_no_value_label()
          : formatPercent(values.treynor, "two"),
    },
    {
      label: m.learning_market_line_label(),
      value: <ChangeText colored change={formatSignedPercent(values.alpha)} />,
    },
  ];
}
