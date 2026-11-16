import type { ReactNode } from "react";
import { Icon } from "~/icon";
import { m } from "~/paraglide/messages.js";
import styles from "./lesson-practice.module.css";

export function PracticePanel({
  children,
  idPrefix = "",
}: {
  children: ReactNode;
  idPrefix?: string;
}): ReactNode {
  return (
    <section
      id={`${idPrefix}practice`}
      className={styles["practice"]}
      aria-labelledby={`${idPrefix}lesson-practice-title`}
    >
      <h2 id={`${idPrefix}lesson-practice-title`}>
        <Icon name="flask" className={undefined} />
        {m.learning_practice_title()}
      </h2>
      {children}
    </section>
  );
}
