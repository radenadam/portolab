import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import {
  DiversificationPractice,
  DiversificationOwnNumbers,
} from "./diversification-practice";
import { useState } from "react";
import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import { TwoStockFormula } from "./two-stock-formula";
import { formatCorrelation, formatPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { correlation } from "~/units/correlation";
import type { Correlation } from "~/units/correlation";
import { portfolioWeight } from "~/units/portfolio-weight";
import { useIsInBrowser } from "~/use-is-in-browser";
import { LessonSlider } from "./lesson-slider";
import { TwoStockCurve } from "./two-stock-curve";
import { defaultPairWeight, twoStockAllocation } from "./two-stock-allocation";
import styles from "./lesson-practice.module.css";
import localStyles from "./trading-lesson.module.css";

export function LessonDiversification({
  classId,
  portfolio,
  own,
  explanation,
  missingNumbers,
  children,
  idPrefix = "",
  taskPage,
}: {
  classId: ClassId;
  portfolio: PortfolioSummary;
  own: PortfolioSummary | undefined;
  explanation: ReactNode;
  missingNumbers: ReactNode;
  children: ReactNode;
  idPrefix?: string;
  taskPage?: string | undefined;
}): ReactNode {
  const available = portfolio.holdings;
  const initial = initialPair(portfolio);
  const [first, setFirst] = useState(initial.first);
  const [second, setSecond] = useState(initial.second);
  const [weight, setWeight] = useState(defaultPairWeight);
  const [override, setOverride] = useState<Correlation>();
  const interactive = useIsInBrowser();
  const pair = selectedPair(portfolio, first, second);
  // A portfolio refresh can remove a selected stock while its explanation is open.
  if (pair === undefined) {
    setFirst(initial.first);
    setSecond(initial.second);
    setOverride(undefined);
    setWeight(defaultPairWeight);
    return null;
  }
  const rho = override ?? pair.correlation;
  const measured = twoStockAllocation(portfolio, {
    first,
    second,
    weight,
    correlation: rho,
  });
  const selectPair = (firstCode: string, secondCode: string): void => {
    setFirst(firstCode);
    setSecond(secondCode);
    setOverride(undefined);
    setWeight(defaultPairWeight);
  };
  return (
    <>
      <section
        className={styles["interactive"]}
        aria-labelledby={`${idPrefix}lesson-interactive-title`}
      >
        <h2 id={`${idPrefix}lesson-interactive-title`}>
          {m.learning_two_stocks_title()}
        </h2>
        {(own?.holdings.length ?? 0) < 2 && (
          <p className={styles["muted"]}>{m.learning_example_notice()}</p>
        )}
        {interactive && available.length > 2 && (
          <>
            <div
              className={localStyles["choices"]}
              role="group"
              aria-label={m.learning_stock_a_label()}
            >
              <span>{m.learning_stock_a_label()}</span>
              {available
                .filter((holding) => holding.code !== second)
                .map((holding) => (
                  <button
                    key={holding.code}
                    type="button"
                    className={localStyles["choice"]}
                    aria-pressed={first === holding.code}
                    onClick={() => {
                      selectPair(holding.code, second);
                    }}
                  >
                    {holding.code}
                  </button>
                ))}
            </div>
            <div
              className={localStyles["choices"]}
              role="group"
              aria-label={m.learning_stock_b_label()}
            >
              <span>{m.learning_stock_b_label()}</span>
              {available
                .filter((holding) => holding.code !== first)
                .map((holding) => (
                  <button
                    key={holding.code}
                    type="button"
                    className={localStyles["choice"]}
                    aria-pressed={second === holding.code}
                    onClick={() => {
                      selectPair(first, holding.code);
                    }}
                  >
                    {holding.code}
                  </button>
                ))}
            </div>
          </>
        )}
        <LessonSlider
          id={`${idPrefix}two-stock-weight`}
          kind="weight"
          label={m.learning_stock_weight_label({ code: first })}
          text={m.learning_pair_weights_label({
            first,
            second,
            a: formatPercent(weight),
            b: formatPercent(1 - weight),
          })}
          value={weight * 100}
          maximum={100}
          step={5}
          onChange={(value) => {
            setWeight(portfolioWeight(value / 100));
          }}
        />
        <LessonSlider
          id={`${idPrefix}two-stock-correlation`}
          kind="correlation"
          label={m.learning_correlation_label()}
          text={formatCorrelation(rho)}
          value={rho}
          minimum={-1}
          maximum={1}
          step="any"
          onChange={(value) => {
            setOverride(correlation(value));
          }}
        />
        {override === undefined ? (
          <p className={styles["muted"]}>
            <NumberText>
              {m.learning_observed_correlation_notice({
                returns: monthlyReturnCount(portfolio.market.returns.length),
              })}
            </NumberText>
          </p>
        ) : (
          <button
            type="button"
            className={styles["link"]}
            onClick={() => {
              setOverride(undefined);
            }}
          >
            {m.learning_restore_correlation_label({
              first,
              second,
              value: formatCorrelation(pair.correlation),
            })}
          </button>
        )}
        <TwoStockCurve
          portfolio={portfolio}
          first={first}
          second={second}
          weight={weight}
          rho={rho}
          labelledBy={`${idPrefix}lesson-interactive-title`}
        />
        <dl
          className={styles["statistics"]}
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <dt>{m.learning_portfolio_risk_label()}</dt>
            <dd>
              <NumberText whole>
                {formatPercent(measured.standardDeviation.value, "two")}
              </NumberText>
            </dd>
          </div>
          <div>
            <dt>{m.learning_average_risk_label()}</dt>
            <dd>
              <NumberText whole>
                {formatPercent(measured.averageRisk, "two")}
              </NumberText>
            </dd>
          </div>
          <div>
            <dt>{m.learning_expected_return_label()}</dt>
            <dd>
              <NumberText whole>
                {formatPercent(measured.expectedReturn.value, "two")}
              </NumberText>
            </dd>
          </div>
        </dl>
        <div className={styles["formula"]}>
          <TwoStockFormula measured={measured} />
          {explanation}
        </div>
      </section>
      <DiversificationOwnNumbers own={own} />
      {children}
      <DiversificationPractice
        classId={classId}
        own={own}
        first={first}
        second={second}
        selectPair={selectPair}
        idPrefix={idPrefix}
        taskPage={taskPage}
        missingNumbers={missingNumbers}
      />
    </>
  );
}

function selectedPair(
  portfolio: PortfolioSummary,
  first: string,
  second: string,
) {
  const pairs = portfolio.pairs.filter((pair) => pair.first !== pair.second);
  const pair = pairs.find(
    (entry) =>
      (entry.first === first && entry.second === second) ||
      (entry.second === first && entry.first === second),
  );
  return pair;
}

function initialPair(portfolio: PortfolioSummary) {
  const pair = portfolio.pairs.find((entry) => entry.first !== entry.second);
  if (pair === undefined)
    throw new Error("The diversification exercise needs two measured stocks.");
  return pair;
}
