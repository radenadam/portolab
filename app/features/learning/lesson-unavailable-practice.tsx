import type { ReactNode } from "react";

import type { ClassId } from "~/features/classes/classes.schema";

import { marketPath } from "~/features/market-data/market-path";

import { m } from "~/paraglide/messages.js";
import type { SessionContent } from "./content";

import type { LessonPracticeData } from "./lesson-practice-data";
import { LessonTaskLink } from "./lesson-task-link";
import { PracticePanel } from "./practice-panel";
import { lessonTaskField } from "./lesson-task";
import { pathWithQuery } from "~/path-with-query";
import styles from "./lesson-practice.module.css";

export function LessonUnavailablePractice({
  classId,
  lesson,
  practice,
  idPrefix = "",
  taskPage,
  children,
}: {
  classId: ClassId;
  lesson: SessionContent;
  practice: LessonPracticeData;
  idPrefix?: string;
  taskPage?: string | undefined;
  children: ReactNode;
}): ReactNode {
  const report = practice.report;
  return (
    <PracticePanel idPrefix={idPrefix}>
      {children}
      {report?.kind === "noHoldings" && (
        <div className={styles["task"]}>
          <p>
            <strong>{m.learning_task_label()}</strong>{" "}
            {m.learning_first_stock_task_notice()}
          </p>
          <LessonTaskLink
            to={pathWithQuery(marketPath(classId), {
              [lessonTaskField]: String(lesson.session),
            })}
            label={m.learning_first_stock_link()}
            taskPage={taskPage}
          />
        </div>
      )}
    </PracticePanel>
  );
}
