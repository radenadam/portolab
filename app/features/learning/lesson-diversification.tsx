import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import { DiversificationPractice } from "./diversification-practice";
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
import { LessonExplanation } from "./lesson-explanation";
import { LessonOwnNumbers } from "./lesson-own-numbers";
import type { LessonPracticeProps } from "./lesson-practice-data";
import { LessonSlider } from "./lesson-slider";
import { PairChoices } from "./pair-choices";
import { practicePortfolio } from "./practice-portfolio";
import { TwoStockCurve } from "./two-stock-curve";
import { defaultPairWeight, twoStockAllocation } from "./two-stock-allocation";
import styles from "./lesson-practice.module.css";

type StockPair = PortfolioSummary["pairs"][number];

export function LessonDiversification({
  classId,
  lesson,
  practice,
  children,
  idPrefix = "",
  taskPage,
}: LessonPracticeProps): ReactNode {
  const own = practicePortfolio(practice.report);
  const simulation = practice.simulation;
  const explanation = (
    <LessonExplanation
      lesson={lesson}
      activity="diversification"
      practice={practice}
      portfolio={simulation}
    />
  );
  const ownNumbers = (
    <LessonOwnNumbers
      classId={classId}
      activity="diversification"
      practice={practice}
    />
  );
  const initial = simulation === undefined ? undefined : pairsOf(simulation)[0];
  if (simulation === undefined || initial === undefined)
    return (
      <>
        <section className={styles["interactive"]}>
          <h2>{m.learning_two_stocks_title()}</h2>
          <p>{m.learning_interactive_data_notice()}</p>
          {explanation}
        </section>
        {own !== undefined && ownNumbers}
        {children}
        <DiversificationPractice
          classId={classId}
          own={own}
          chart={undefined}
          ownNumbers={ownNumbers}
          idPrefix={idPrefix}
          taskPage={taskPage}
        />
      </>
    );
  return (
    <TwoStockLesson
      classId={classId}
      portfolio={simulation}
      initial={initial}
      own={own}
      explanation={explanation}
      ownNumbers={ownNumbers}
      idPrefix={idPrefix}
      taskPage={taskPage}
    >
      {children}
    </TwoStockLesson>
  );
}

function TwoStockLesson({
  classId,
  portfolio,
  initial,
  own,
  explanation,
  ownNumbers,
  children,
  idPrefix,
  taskPage,
}: {
  classId: ClassId;
  portfolio: PortfolioSummary;
  initial: StockPair;
  own: PortfolioSummary | undefined;
  explanation: ReactNode;
  ownNumbers: ReactNode;
  children: ReactNode;
  idPrefix: string;
  taskPage: string | undefined;
}): ReactNode {
  const [chosen, setChosen] = useState({
    first: initial.first,
    second: initial.second,
  });
  const [weight, setWeight] = useState(defaultPairWeight);
  const [override, setOverride] = useState<Correlation>();
  const interactive = useIsInBrowser();
  // A refresh of the portfolio can remove a chosen stock while the lesson is open, and the lesson then starts again from its first pair.
  const chosenPair = pairsOf(portfolio).find(
    (entry) =>
      (entry.first === chosen.first && entry.second === chosen.second) ||
      (entry.first === chosen.second && entry.second === chosen.first),
  );
  const { first, second } = chosenPair === undefined ? initial : chosen;
  const observed = (chosenPair ?? initial).correlation;
  const rho = (chosenPair === undefined ? undefined : override) ?? observed;
  const measured = twoStockAllocation(portfolio, {
    first,
    second,
    weight,
    correlation: rho,
  });
  const selectPair = (firstCode: string, secondCode: string): void => {
    setChosen({ first: firstCode, second: secondCode });
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
        {interactive && portfolio.holdings.length > 2 && (
          <>
            <PairChoices
              label={m.learning_stock_a_label()}
              holdings={portfolio.holdings}
              chosen={first}
              other={second}
              select={(code) => {
                selectPair(code, second);
              }}
            />
            <PairChoices
              label={m.learning_stock_b_label()}
              holdings={portfolio.holdings}
              chosen={second}
              other={first}
              select={(code) => {
                selectPair(first, code);
              }}
            />
          </>
        )}
        <LessonSlider
          id={`${idPrefix}two-stock-weight`}
          kind="pairWeight"
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
        {rho === observed ? (
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
              value: formatCorrelation(observed),
            })}
          </button>
        )}
        <TwoStockCurve
          portfolio={portfolio}
          first={first}
          second={second}
          weight={weight}
          rho={rho}
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
          <TwoStockFormula
            weight={weight}
            risks={measured.risks}
            correlation={rho}
            result={measured.standardDeviation.value}
          />
          {explanation}
        </div>
      </section>
      {own !== undefined && ownNumbers}
      {children}
      <DiversificationPractice
        classId={classId}
        own={own}
        chart={{ first, second, selectPair }}
        ownNumbers={ownNumbers}
        idPrefix={idPrefix}
        taskPage={taskPage}
      />
    </>
  );
}

/** The pairs of two different stocks, because the pairs of a portfolio also hold each stock with itself. */
function pairsOf(portfolio: PortfolioSummary): StockPair[] {
  return portfolio.pairs.filter((pair) => pair.first !== pair.second);
}
