import { useState } from "react";
import type { ReactNode } from "react";
import { useIsInBrowser } from "~/use-is-in-browser";
import { formatPercent } from "~/formatting";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { reweightPortfolio } from "~/features/measures/reweight-portfolio";
import { riskMeasureFailureText } from "~/features/measures/measure-failure-text";
import {
  SharpeRatioFormula,
  TreynorRatioFormula,
} from "~/features/measures/ratio-formulas";
import { NumberText } from "~/number-text";
import { Message } from "~/message";
import { m } from "~/paraglide/messages.js";
import { ExplainedFormula } from "~/math-notation";
import {
  sharpeFormulaText,
  treynorFormulaText,
} from "~/features/measures/formula-texts";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { LessonSlider } from "./lesson-slider";
import { LessonAllocationStatistics } from "./lesson-allocation-statistics";
import { LessonCovariances } from "./lesson-covariances";
import { LessonRiskPractice } from "./lesson-risk-practice";
import styles from "./lesson-practice.module.css";

export function LessonAllocation({
  portfolio,
  own,
  explanation,
  children,
  idPrefix = "",
}: {
  portfolio: PortfolioSummary;
  own: PortfolioSummary | undefined;
  explanation: ReactNode;
  children: ReactNode;
  idPrefix?: string;
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
  return (
    <>
      <section
        className={styles["interactive"]}
        aria-labelledby={`${idPrefix}lesson-interactive-title`}
      >
        <div className={styles["head"]}>
          <h2>
            <span id={`${idPrefix}lesson-interactive-title`}>
              {m.learning_allocation_interactive_title()}
            </span>
            {explanation}
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
            id={`${idPrefix}lesson-weight-${holding.code}`}
            label={holding.code}
            text={formatPercent(holding.weight, "two")}
            value={holding.weight * 100}
            maximum={100}
            step="any"
            onChange={(value) => {
              changeWeight(holding.code, value);
            }}
          />
        ))}
        <p>
          <Message
            text={m.learning_cash_notice}
            values={{
              cash: (
                <strong>
                  <NumberText whole>
                    {formatPercent(measured.cash, "two")}
                  </NumberText>
                </strong>
              ),
            }}
          />
        </p>
        <LessonAllocationStatistics measured={measured} own={own} />
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
          <ExplainedFormula text={sharpeFormulaText()}>
            <SharpeRatioFormula
              inputs={{
                ...excess,
                standardDeviation: measured.standardDeviation.value,
              }}
            />
          </ExplainedFormula>
          <ExplainedFormula text={treynorFormulaText()}>
            <TreynorRatioFormula
              inputs={{ ...excess, beta: measured.beta.value }}
            />
          </ExplainedFormula>
        </div>
      </section>
      {children}
      {own !== undefined && (
        <LessonRiskPractice
          portfolio={own}
          current={measured.standardDeviation.value}
          idPrefix={idPrefix}
        />
      )}
    </>
  );
}
