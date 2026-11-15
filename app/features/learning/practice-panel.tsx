import type { ReactNode } from "react";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import styles from "./lesson-practice.module.css";

export function PracticePanel({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <section
      id="practice"
      className={styles["practice"]}
      aria-labelledby="lesson-practice-title"
    >
      <h2 id="lesson-practice-title">
        <Icon name="flask" className={undefined} />
        {m.learning_practice_title()}
      </h2>
      {children}
    </section>
  );
}
