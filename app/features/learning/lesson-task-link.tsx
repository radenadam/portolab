import type { ReactNode } from "react";
import { Link } from "react-router";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import styles from "./lesson-practice.module.css";
import learningStyles from "./learning.module.css";

/** The step of a task. In a sheet it opens the lesson page first, as decision 0048 explains, so the reader never leaves the screen under the sheet by surprise. */
export function LessonTaskLink({
  to,
  label,
  taskPage,
}: {
  to: string;
  label: string;
  taskPage: string | undefined;
}): ReactNode {
  return (
    <Link
      className={
        taskPage === undefined ? styles["button"] : learningStyles["button"]
      }
      to={taskPage ?? to}
    >
      {taskPage === undefined ? label : m.learning_open_practice_link()}
      <Icon name="arrowRight" className={learningStyles["icon"]} />
    </Link>
  );
}
