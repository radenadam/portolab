import { lessonBetaRange } from "./lesson-beta-range";
import { useState } from "react";
import type { ReactNode } from "react";
import { RiskMap } from "~/charts/risk-map";
import type { MarkedPoint } from "~/charts/layout-risk-map";
import { useIsInBrowser } from "~/charts/use-is-in-browser";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { measureRequiredReturn } from "~/features/measures/capm";
import { RequiredReturnFormula } from "~/features/measures/capm-formulas";
import { formatBeta, formatPercent, formatNumber } from "~/formatting";
import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { beta, marketBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { LessonPracticeData } from "./lesson-practice-data";
import { LessonSlider } from "./lesson-slider";
import styles from "./lesson-practice.module.css";

export function LessonCapm({
  practice,
  explanation,
}: {
  practice: LessonPracticeData;
  explanation: ReactNode;
}): ReactNode {
  const [selected, setSelected] = useState(practice.initialBeta);
  const [showHoldings, setShowHoldings] = useState(true);
  const interactive = useIsInBrowser();
  const market = practice.market;
  if (market === undefined) return null;
  const required = measureRequiredReturn(selected, {
    riskFreeRate: market.riskFreeRate,
    expectedReturn: { value: market.expectedReturn },
  });
  const points: MarkedPoint<Beta, MonthlyReturn>[] = [
    {
      key: "selected",
      name: `β ${formatBeta(selected)}`,
      across: selected,
      up: required.value,
      mark: { kind: "own" },
      values: [
        { name: m.learning_analysis_beta_label(), value: formatBeta(selected) },
        {
          name: m.learning_required_return_label(),
          value: formatPercent(required.value, "three"),
        },
      ],
    },
  ];
  if (showHoldings)
    for (const holding of practice.holdings)
      points.push({
        key: holding.code,
        name: holding.code,
        across: holding.beta,
        up: holding.expectedReturn,
        stem: holding.requiredReturn.value,
        mark: { kind: "held", weight: undefined },
        popover: `lesson-alpha-${holding.code}`,
        values: [
          {
            name: m.learning_analysis_beta_label(),
            value: formatBeta(holding.beta),
          },
          {
            name: m.learning_expected_return_label(),
            value: formatPercent(holding.expectedReturn, "two"),
          },
        ],
      });
  return (
    <section
      className={styles["interactive"]}
      aria-labelledby="lesson-interactive-title"
    >
      <h2 id="lesson-interactive-title">
        {m.learning_capm_interactive_title()}
      </h2>
      <LessonSlider
        id="lesson-beta"
        kind="beta"
        label={m.learning_analysis_beta_label()}
        text={formatBeta(selected)}
        value={selected}
        minimum={Math.min(lessonBetaRange.minimum, practice.initialBeta)}
        maximum={Math.max(lessonBetaRange.maximum, practice.initialBeta)}
        step={lessonBetaRange.step}
        onChange={(value) => {
          setSelected(beta(value));
        }}
      />
      <div className={styles["map"]}>
        <RiskMap
          market={{
            key: marketIndex.code,
            name: marketIndex.code,
            across: marketBeta,
            up: market.expectedReturn,
            values: [],
          }}
          points={points}
          across={{
            style: "decimal",
            toValue: beta,
            title: m.learning_analysis_beta_label(),
            include: [
              beta(lessonBetaRange.minimum),
              beta(lessonBetaRange.maximum),
            ],
          }}
          up={{ style: "percent", toValue: monthlyReturn }}
          line={{
            name: "",
            start: { across: beta(0), up: market.riskFreeRate.value },
          }}
          labelledBy="lesson-interactive-title"
          fill
        />
      </div>
      {interactive && practice.holdings.length > 0 && (
        <label className={styles["check"]}>
          <input
            type="checkbox"
            className={styles["checkbox"]}
            checked={showHoldings}
            onChange={(event) => {
              setShowHoldings(event.currentTarget.checked);
            }}
          />
          {m.learning_show_holdings_label()}
        </label>
      )}
      <div className={styles["formula"]}>
        <p>
          <RequiredReturnFormula
            of="i"
            required={required}
            decimals="three"
            stacked
          />
        </p>
        <strong>
          <NumberText>
            {m.learning_monthly_result_notice({
              value: formatPercent(required.value, "three"),
            })}
          </NumberText>
        </strong>
        <div className={styles["inputs"]}>
          <p>
            <NumberText>
              {m.learning_capm_inputs_notice({
                annual: formatPercent(market.riskFreeRate.inputs.annualRate),
                months: formatNumber(market.riskFreeRate.inputs.monthsPerYear),
                monthly: formatPercent(market.riskFreeRate.value, "three"),
                returns: monthlyReturnCount(market.returns.length),
                index: marketIndex.code,
              })}
            </NumberText>
          </p>
          {explanation}
        </div>
      </div>
    </section>
  );
}
