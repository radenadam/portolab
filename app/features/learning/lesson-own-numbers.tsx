import { practicePortfolio } from "./practice-portfolio";
import type { ReactNode } from "react";
import { Message } from "~/message";
import { ChangeText } from "~/change-text";
import type { ClassId } from "~/features/classes/classes.schema";
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
          <Message
            text={m.learning_allocation_numbers_notice}
            values={{
              expected: emphasizedNumber(
                formatPercent(own.expectedReturn, "two"),
              ),
              risk: emphasizedNumber(
                formatPercent(own.standardDeviation, "two"),
              ),
              sharpe: emphasizedNumber(
                own.sharpeRatio.ok
                  ? formatSharpeRatio(own.sharpeRatio.value)
                  : m.learning_no_value_label(),
              ),
              treynor: emphasizedNumber(
                own.treynorRatio.ok
                  ? formatPercent(own.treynorRatio.value, "two")
                  : m.learning_no_value_label(),
              ),
            }}
          />
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
function CapmNumbers({
  portfolio,
}: {
  portfolio: NonNullable<LessonPracticeData["simulation"]>;
}): ReactNode {
  const change = formatSignedPercent(portfolio.securityMarketLine.value);
  return (
    <p>
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
    </p>
  );
}

export function emphasizedNumber(value: string): ReactNode {
  return (
    <strong>
      <NumberText whole>{value}</NumberText>
    </strong>
  );
}
