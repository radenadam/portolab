import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { ComparedStudent } from "./student-filters";
import styles from "./grading.module.css";

export function StudentMapNotice({
  student,
}: {
  student: ComparedStudent;
}): ReactNode {
  if (!("measures" in student) || student.marketReturn !== undefined)
    return null;
  return (
    <p className={styles["details"]}>
      <NumberText>
        {m.grading_map_unavailable_notice({ index: marketIndex.code })}
      </NumberText>
    </p>
  );
}
