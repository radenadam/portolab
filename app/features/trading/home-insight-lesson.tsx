import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import type { SessionNumber } from "~/features/classes/course-calendar";
import { LessonLink } from "~/features/learning/lesson-link";
import { m } from "~/paraglide/messages.js";
import styles from "./home-portfolio.module.css";

export function HomeInsightLesson({
  session,
}: {
  session: SessionNumber;
}): ReactNode {
  return (
    <LessonLink className={styles["learnLink"]} session={session}>
      <NumberText>{m.trading_home_learn_label()}</NumberText>{" "}
      <span aria-hidden="true">→</span>
    </LessonLink>
  );
}
