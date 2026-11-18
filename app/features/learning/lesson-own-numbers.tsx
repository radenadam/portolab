import { practicePortfolio } from "./practice-portfolio";
import type { ReactNode } from "react";
import { Message } from "~/message";
import { ChangeText } from "~/change-text";
import type { ClassId } from "~/features/classes/classes.schema";
import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";
import { measureFailureText } from "~/features/measures/measure-failure-text";

import {
  formatBeta,
  formatPercent,
  formatSignedPercent,
  formatSharpeRatio,
} from "~/formatting";
import { NumberText } from "~/number-text";
import { weightedHoldingRisk } from "~/features/measures/weighted-holding-risk";
import { m } from "~/paraglide/messages.js";
import { DiversificationNumbers } from "./diversification-numbers";
import { emphasizedNumber } from "./emphasized-number";
import type { MeasuredLessonActivity } from "./lesson-practice-sessions";

import type { LessonPracticeData } from "./lesson-practice-data";

import styles from "./lesson-practice.module.css";

export function LessonOwnNumbers({
  classId,
  activity,
  practice,
}: {
  classId: ClassId;
  activity: MeasuredLessonActivity;
  practice: LessonPracticeData;
}): ReactNode {
  const report = practice.report;
  const own = practicePortfolio(report);
  return (
    <section
      className={styles["yours"]}
      aria-label={m.learning_your_numbers_label()}
    >
      <strong>{m.learning_your_numbers_label()}</strong>
      {own === undefined ? (
        <>
          <p>
            {report === undefined ? (
              m.learning_student_portfolio_notice()
            ) : (
              <PortfolioMeasuresNotice
                report={report}
                reader={{ kind: "owner", classId }}
              />
            )}
          </p>
          {report?.kind !== "measured" &&
            practice.marketFailure !== undefined && (
              <p>
                <NumberText>
                  {measureFailureText(practice.marketFailure, {
                    kind: "market",
                  })}
                </NumberText>
              </p>
            )}
        </>
      ) : (
        <p>
          <MeasuredNumbers activity={activity} portfolio={own} />
        </p>
      )}
      {own !== undefined && (
        <p className={styles["provenance"]}>
          {m.learning_price_times_notice()}
        </p>
      )}
    </section>
  );
}
function MeasuredNumbers({
  activity,
  portfolio,
}: {
  activity: MeasuredLessonActivity;
  portfolio: NonNullable<LessonPracticeData["simulation"]>;
}): ReactNode {
  switch (activity) {
    case "diversification":
      return (
        <DiversificationNumbers
          average={weightedHoldingRisk(portfolio)}
          risk={portfolio.standardDeviation}
        />
      );
    case "capm":
      return <CapmNumbers portfolio={portfolio} />;
    case "allocation":
      return <AllocationNumbers portfolio={portfolio} />;
  }
}

function AllocationNumbers({
  portfolio,
}: {
  portfolio: NonNullable<LessonPracticeData["simulation"]>;
}): ReactNode {
  return (
    <Message
      text={m.learning_allocation_numbers_notice}
      values={{
        expected: emphasizedNumber(
          formatPercent(portfolio.expectedReturn, "two"),
        ),
        risk: emphasizedNumber(
          formatPercent(portfolio.standardDeviation, "two"),
        ),
        sharpe: emphasizedNumber(
          portfolio.sharpeRatio.ok
            ? formatSharpeRatio(portfolio.sharpeRatio.value)
            : m.learning_no_value_label(),
        ),
        treynor: emphasizedNumber(
          portfolio.treynorRatio.ok
            ? formatPercent(portfolio.treynorRatio.value, "two")
            : m.learning_no_value_label(),
        ),
      }}
    />
  );
}

function CapmNumbers({
  portfolio,
}: {
  portfolio: NonNullable<LessonPracticeData["simulation"]>;
}): ReactNode {
  const change = formatSignedPercent(portfolio.securityMarketLine.value);
  return (
    <Message
      text={m.learning_capm_numbers_notice}
      values={{
        beta: emphasizedNumber(formatBeta(portfolio.beta)),
        required: emphasizedNumber(
          formatPercent(portfolio.requiredReturn.value, "two"),
        ),
        expected: emphasizedNumber(
          formatPercent(portfolio.expectedReturn, "two"),
        ),
        alpha: <ChangeText colored change={change} />,
      }}
    />
  );
}
