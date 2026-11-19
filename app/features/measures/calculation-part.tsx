import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import type { MeasureRow } from "./measure-list";
import styles from "./calculation-part.module.css";

/** One measure in a calculation, as a list of measures shows it: its name with its value beside it, the sentence that says what its formula computes, and its formula with its numbers. A calculation that needs a second measure, such as the required return of Jensen's alpha, shows that measure as a part of its own. */
export function CalculationPart({
  title,
  level,
  row,
}: {
  title: string;
  level: 2 | 3;
  row: MeasureRow;
}): ReactNode {
  const heading = <NumberText>{title}</NumberText>;
  return (
    <div className={styles["calculationPart"]}>
      <div className={styles["calculationHead"]}>
        {level === 2 ? <h2>{heading}</h2> : <h3>{heading}</h3>}
        <strong>
          <NumberText whole>{row.value}</NumberText>
        </strong>
      </div>
      <p className={styles["calculationText"]}>
        <NumberText>{row.description}</NumberText>
      </p>
      <p>{row.formula}</p>
    </div>
  );
}
