import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { lessonTaskReturnPath } from "./lesson-task";
import type { LessonTask } from "./lesson-task";
import styles from "./lesson-practice.module.css";

export function LessonTaskBanner({
  classId,
  task,
}: {
  classId: ClassId;
  task: LessonTask | undefined;
}): ReactNode {
  if (task === undefined) return null;
  return (
    <aside className={styles["banner"]} role="note">
      <span className={styles["badge"]}>
        <NumberText>
          {m.learning_task_session_label({ session: formatNumber(task) })}
        </NumberText>
      </span>
      <p>{m.learning_first_stock_task_notice()}</p>
      <Link className={styles["link"]} to={lessonTaskReturnPath(classId, task)}>
        {m.learning_task_return_link()}
      </Link>
    </aside>
  );
}
