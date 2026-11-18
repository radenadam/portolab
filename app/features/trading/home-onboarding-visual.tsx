import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import conceptStyles from "~/concept-card.module.css";
import chipStyles from "~/chip.module.css";
import { minimumSparklineCloses, Sparkline } from "~/charts/sparkline";
import { countedText } from "~/counted-text";
import { SimulationLabel } from "~/features/market-data/simulation-label";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { sectorName } from "~/features/market-data/sector-name";
import { measureConcept } from "~/features/measures/measure-concept";
import { BetaFormula, RiskFree } from "~/features/measures/formulas";
import {
  formatBeta,
  formatCalendarDate,
  formatNumber,
  formatPercent,
} from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { HomeAmount } from "./home-amount";
import { ImpactRow } from "./impact-row";
import { onboardingImpactExample } from "./onboarding-impact-example";
import type { OnboardingStep } from "./onboarding";
import type { HomeWelcomeData } from "./read-home-welcome.server";
import styles from "./home-onboarding-visual.module.css";

export function HomeOnboardingVisual({
  step,
  welcome,
  delayMinutes,
}: {
  step: OnboardingStep;
  welcome: HomeWelcomeData;
  delayMinutes: number;
}): ReactNode {
  switch (step) {
    case "cash": {
      const history = welcome.indexHistory;
      return (
        <>
          <p className={styles["caption"]}>
            {m.trading_onboarding_starting_cash_label()}
          </p>
          <HomeAmount amount={welcome.startingCash} />
          <span
            className={[
              chipStyles["chip"],
              chipStyles["warning"],
              styles["simulation"],
            ].join(" ")}
          >
            <SimulationLabel delayMinutes={delayMinutes} full />
          </span>
          {history.values.length >= minimumSparklineCloses &&
          history.end !== undefined ? (
            <figure className={styles["history"]}>
              <div className={styles["spark"]}>
                <Sparkline kind="index" closes={history.values} />
              </div>
              <figcaption className={styles["caption"]}>
                <NumberText>
                  {m.trading_onboarding_index_history_notice({
                    index: marketIndex.code,
                    months: formatNumber(history.months),
                    date: formatCalendarDate(history.end),
                  })}
                </NumberText>
              </figcaption>
            </figure>
          ) : (
            <p className={styles["caption"]}>
              <NumberText>
                {countedText(
                  history.values.length,
                  {
                    one: m.trading_onboarding_one_close_notice,
                    several: m.trading_onboarding_several_closes_notice,
                  },
                  {
                    index: marketIndex.code,
                    count: formatNumber(history.values.length),
                    minimum: formatNumber(minimumSparklineCloses),
                  },
                )}
              </NumberText>
            </p>
          )}
        </>
      );
    }
    case "impact": {
      const example = onboardingImpactExample;
      return (
        <>
          <p className={styles["caption"]}>
            <NumberText>
              {m.trading_onboarding_impact_example_label({
                share: formatPercent(example.share, "integer"),
              })}
            </NumberText>
          </p>
          <div>
            <ImpactRow
              name={m.trading_impact_beta_label()}
              {...example.beta}
              format={formatBeta}
            />
            <ImpactRow
              name={m.trading_impact_risk_label()}
              {...example.risk}
              format={(value) => formatPercent(value, "two")}
            />
            <ImpactRow
              name={m.trading_impact_weight_label({
                name: sectorName("financials"),
              })}
              {...example.sectorWeight}
              format={(value) => formatPercent(value, "one")}
            />
          </div>
        </>
      );
    }
    case "help": {
      const meaning = measureConcept("beta").meaning;
      const formula = <BetaFormula beta={undefined} />;
      const example = (
        <p>
          <NumberText>{m.trading_onboarding_beta_notice()}</NumberText>
        </p>
      );
      return (
        <>
          <div className={styles["beta"]}>
            <strong>{m.trading_home_beta_label()}</strong>
            <ConceptCard
              title={m.trading_home_beta_label()}
              meaning={meaning}
              example={example}
              calculation={formula}
            />
          </div>
          <p className={styles["meaning"]}>
            <NumberText>{meaning}</NumberText>
          </p>
          <div className={conceptStyles["example"]}>
            <p className={styles["numberLabel"]}>
              {m.trading_onboarding_own_number_label()}
            </p>
            {example}
          </div>
          <p className={styles["formula"]}>{formula}</p>
          {welcome.riskFree.ok ? (
            <p className={styles["caption"]}>
              <RiskFree />{" "}
              <NumberText>
                {m.trading_onboarding_risk_free_notice({
                  monthly: formatPercent(welcome.riskFree.value.value, "two"),
                  annual: formatPercent(
                    welcome.riskFree.value.inputs.annualRate,
                    "two",
                  ),
                })}
              </NumberText>
            </p>
          ) : (
            <p className={styles["caption"]}>
              <NumberText>{welcome.riskFree.failure}</NumberText>
            </p>
          )}
        </>
      );
    }
  }
}
