import { useState } from "react";
import type { ReactNode } from "react";
import { useIsInBrowser } from "~/charts/use-is-in-browser";
import { ChangeText } from "~/change-text";
import {
  formatBeta,
  formatPercent,
  formatSignedPercent,
  formatSharpeRatio,
} from "~/formatting";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { reweightPortfolio } from "~/features/measures/reweight-portfolio";
import { riskMeasureFailureText } from "~/features/measures/measure-failure-text";
import {
  SharpeRatioFormula,
  TreynorRatioFormula,
} from "~/features/measures/ratio-formulas";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { LessonSlider } from "./lesson-slider";
import { LessonCovariances } from "./lesson-covariances";
import { LessonRiskPractice } from "./lesson-risk-practice";
import styles from "./lesson-practice.module.css";

export function LessonAllocation({
  portfolio,
  own,
  explanation,
  children,
}: {
  portfolio: PortfolioSummary;
  own: PortfolioSummary | undefined;
  explanation: ReactNode;
  children: ReactNode;
}): ReactNode {
  const [weights, setWeights] = useState<ReadonlyMap<string, PortfolioWeight>>(
    () => new Map(),
  );
  const interactive = useIsInBrowser();
  const measured = reweightPortfolio(portfolio, weights);
  const changeWeight = (code: string, percent: number): void => {
    let others = 0;
    for (const holding of measured.holdings)
      if (holding.code !== code) others += holding.weight;
    const updated = new Map(weights);
    updated.set(
      code,
      portfolioWeight(Math.max(0, Math.min(percent / 100, 1 - others))),
    );
    setWeights(updated);
  };
  const excess = {
    expectedReturn: measured.expectedReturn.value,
    riskFreeRate: portfolio.market.riskFreeRate.value,
  };
  const statistics: { label: string; value: ReactNode }[] = [
    {
      label: m.learning_expected_return_label(),
      value: formatPercent(measured.expectedReturn.value, "two"),
    },
    {
      label: m.learning_standard_deviation_label(),
      value: formatPercent(measured.standardDeviation.value, "two"),
    },
    {
      label: m.learning_analysis_beta_label(),
      value: formatBeta(measured.beta.value),
    },
    {
      label: m.learning_sharpe_ratio_label(),
      value: measured.sharpeRatio.ok
        ? formatSharpeRatio(measured.sharpeRatio.value.value)
        : m.learning_no_value_label(),
    },
    {
      label: m.learning_treynor_ratio_label(),
      value: measured.treynorRatio.ok
        ? formatPercent(measured.treynorRatio.value.value, "two")
        : m.learning_no_value_label(),
    },
    {
      label: m.learning_market_line_label(),
      value: (
        <ChangeText
          colored
          change={formatSignedPercent(measured.securityMarketLine.value)}
        />
      ),
    },
  ];
  return (
    <>
      <section
        className={styles["interactive"]}
        aria-labelledby="lesson-interactive-title"
      >
        <div className={styles["head"]}>
          <h2 id="lesson-interactive-title">
            {m.learning_allocation_interactive_title()}
          </h2>
          {interactive && (
            <button
              type="button"
              className={styles["link"]}
              onClick={() => {
                setWeights(new Map());
              }}
            >
              {m.learning_reset_label()}
            </button>
          )}
        </div>
        {own === undefined && (
          <p className={styles["muted"]}>{m.learning_example_notice()}</p>
        )}
        {measured.holdings.map((holding) => (
          <LessonSlider
            key={holding.code}
            kind="weight"
            id={`lesson-weight-${holding.code}`}
            label={holding.code}
            text={formatPercent(holding.weight, "two")}
            value={holding.weight * 100}
            maximum={100}
            step={1}
            onChange={(value) => {
              changeWeight(holding.code, value);
            }}
          />
        ))}
        <p>
          <NumberText>
            {m.learning_cash_notice({
              cash: formatPercent(measured.cash, "two"),
            })}
          </NumberText>
        </p>
        <dl className={styles["statistics"]}>
          {statistics.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <NumberText whole>{value}</NumberText>
              </dd>
            </div>
          ))}
        </dl>
        {!measured.sharpeRatio.ok && (
          <p>
            <NumberText>
              {riskMeasureFailureText(
                measured.sharpeRatio.failure,
                "allocation",
              )}
            </NumberText>
          </p>
        )}
        {!measured.treynorRatio.ok && (
          <p>
            <NumberText>
              {riskMeasureFailureText(
                measured.treynorRatio.failure,
                "allocation",
              )}
            </NumberText>
          </p>
        )}
        <LessonCovariances
          portfolio={portfolio}
          weights={measured.holdings}
          variance={measured.variance.value}
        />
        <div className={styles["formula"]}>
          <p>
            <SharpeRatioFormula
              inputs={{
                ...excess,
                standardDeviation: measured.standardDeviation.value,
              }}
            />
          </p>
          <p>
            <TreynorRatioFormula
              inputs={{ ...excess, beta: measured.beta.value }}
            />
          </p>
          {explanation}
        </div>
      </section>
      {children}
      {own !== undefined && (
        <LessonRiskPractice
          portfolio={own}
          current={measured.standardDeviation.value}
        />
      )}
    </>
  );
}
