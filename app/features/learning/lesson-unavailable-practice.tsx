import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "~/icon";

import type { ClassId } from "~/features/classes/classes.schema";

import { marketPath } from "~/features/market-data/market-path";

import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";

import { m } from "~/paraglide/messages.js";
import type { SessionContent } from "./content";

import type { LessonPracticeData } from "./lesson-practice-data";
import { PracticePanel } from "./practice-panel";
import { lessonTaskField } from "./lesson-task";
import { pathWithQuery } from "~/path-with-query";
import styles from "./lesson-practice.module.css";
import learningStyles from "./learning.module.css";

export function LessonUnavailablePractice({
  classId,
  lesson,
  practice,
  idPrefix = "",
  taskPage,
}: {
  classId: ClassId;
  lesson: SessionContent;
  practice: LessonPracticeData;
  idPrefix?: string;
  taskPage?: string | undefined;
}): ReactNode {
  const report = practice.report;
  return (
    <PracticePanel idPrefix={idPrefix}>
      {report?.kind === "noHoldings" ? (
        <div className={styles["task"]}>
          <p>
            <strong>{m.learning_task_label()}</strong>{" "}
            {m.learning_first_stock_task_notice()}
          </p>
          <Link
            className={
              taskPage === undefined
                ? styles["button"]
                : learningStyles["button"]
            }
            to={
              taskPage ??
              pathWithQuery(marketPath(classId), {
                [lessonTaskField]: String(lesson.session),
              })
            }
          >
            {taskPage === undefined
              ? m.learning_first_stock_link()
              : m.learning_open_practice_link()}
            <Icon name="arrowRight" className={learningStyles["icon"]} />
          </Link>
        </div>
      ) : (
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
      )}
    </PracticePanel>
  );
}
