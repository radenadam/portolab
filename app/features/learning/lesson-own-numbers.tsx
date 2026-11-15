import { practicePortfolio } from "./practice-portfolio";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChangeText } from "~/change-text";
import type { ClassId } from "~/features/classes/classes.schema";
import { classPath } from "~/features/classes/class-path";

import { homeHoldingsSectionId } from "~/features/trading/home-holdings-section-id";
import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";

import {
  formatBeta,
  formatPercent,
  formatSignedPercent,
  formatSharpeRatio,
} from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { SessionContent } from "./content";

import type { LessonPracticeData } from "./lesson-practice-data";

import styles from "./lesson-practice.module.css";

export function LessonOwnNumbers({
  classId,
  lesson,
  practice,
}: {
  classId: ClassId;
  lesson: SessionContent;
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
      ) : lesson.session === 9 ? (
        <CapmNumbers portfolio={own} />
      ) : (
        <p>
          <NumberText>
            {m.learning_allocation_numbers_notice({
              expected: formatPercent(own.expectedReturn, "two"),
              risk: formatPercent(own.standardDeviation, "two"),
              sharpe: own.sharpeRatio.ok
                ? formatSharpeRatio(own.sharpeRatio.value)
                : m.learning_no_value_label(),
              treynor: own.treynorRatio.ok
                ? formatPercent(own.treynorRatio.value, "two")
                : m.learning_no_value_label(),
            })}
          </NumberText>
        </p>
      )}
      {own !== undefined && (
        <Link
          className={styles["provenance"]}
          to={`${classPath(classId)}#${homeHoldingsSectionId}`}
        >
          {m.learning_price_times_link()}
        </Link>
      )}
    </section>
  );
}
function CapmNumbers({
  portfolio,
}: {
  portfolio: NonNullable<LessonPracticeData["simulation"]>;
}): ReactNode {
  const change = formatSignedPercent(portfolio.securityMarketLine.value);
  const [before, after] = m
    .learning_capm_numbers_notice({
      beta: formatBeta(portfolio.beta),
      required: formatPercent(portfolio.requiredReturn.value, "two"),
      expected: formatPercent(portfolio.expectedReturn, "two"),
      alpha: "{alpha}",
    })
    .split("{alpha}");
  return (
    <p>
      <NumberText>{before}</NumberText>
      <ChangeText colored change={change} />
      <NumberText>{after}</NumberText>
    </p>
  );
}
