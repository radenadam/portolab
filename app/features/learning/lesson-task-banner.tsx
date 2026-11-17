import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { m } from "~/paraglide/messages.js";
import { formatNumber } from "~/formatting";
import { NumberText } from "~/number-text";
import { Icon } from "~/icon";
import { lessonTaskReturnPath } from "./lesson-task";
import type { LessonTask } from "./lesson-task";
import styles from "./lesson-practice.module.css";
import learningStyles from "./learning.module.css";

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
          {task === "prices"
            ? m.learning_price_guide_badge_label()
            : m.learning_task_session_label({ session: formatNumber(task) })}
        </NumberText>
      </span>
      <p>
        {task === "prices"
          ? m.learning_price_guide_task_notice()
          : task === 6
            ? m.learning_limit_task_banner_notice()
            : task === 2
              ? m.learning_pair_task_banner_notice()
              : m.learning_first_stock_task_notice()}
      </p>
      <Link className={styles["link"]} to={lessonTaskReturnPath(classId, task)}>
        <Icon name="chevronLeft" className={learningStyles["icon"]} />
        {m.learning_task_return_link()}
      </Link>
    </aside>
  );
}
