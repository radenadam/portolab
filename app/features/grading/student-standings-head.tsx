import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import { rankingLabel } from "./ranking-measure";
import type { StudentOptions } from "./students-address";
import styles from "./grading.module.css";

/** The head of the ranking of students, whose ranking column names the measure that the lecturer chose. */
export function StudentStandingsHead({
  measure,
}: {
  measure: StudentOptions["measure"];
}): ReactNode {
  return (
    <thead>
      <tr>
        <th>
          <span className={styles["rankHeading"]}>
            {m.grading_rank_label()}
          </span>
        </th>
        <th>{m.grading_student_label()}</th>
        <th>{m.grading_short_return_label()}</th>
        <th>{m.grading_short_beta_label()}</th>
        <th className={styles["numberHeading"]}>
          {m.grading_short_risk_label()}
        </th>
        <th aria-sort="descending" className={styles["numberHeading"]}>
          {rankingLabel(measure)} ↓
        </th>
        <th>{m.grading_last_activity_label()}</th>
      </tr>
    </thead>
  );
}
