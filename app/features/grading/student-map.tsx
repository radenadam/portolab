import type { ReactNode } from "react";
import { RiskMap } from "~/charts/risk-map";
import type { MarkedPoint } from "~/charts/layout-risk-map";
import { formatBeta, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta, marketBeta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { ComparedStudent } from "./student-filters";
import { selectedStudentHeadingId } from "./students-address";
import styles from "./grading.module.css";

export function StudentMap({
  student,
  all,
  marketReturn,
}: {
  student: ComparedStudent;
  all: readonly ComparedStudent[];
  marketReturn: CumulativeReturn;
}): ReactNode {
  const points: MarkedPoint<Beta, CumulativeReturn>[] = [];
  for (const item of all) {
    if (!("measures" in item) || item.total === undefined) continue;
    points.push({
      key: String(item.studentId),
      name: item.name,
      // The panel names only the selected student, as the references draw it, and the tooltip names every other point.
      ...(item.studentId === student.studentId ? {} : { label: "" }),
      across: item.measures.beta,
      up: item.total.return,
      mark:
        item.studentId === student.studentId
          ? { kind: "own" }
          : { kind: "other" },
      values: [
        {
          name: m.grading_short_return_label(),
          value: formatSignedPercent(item.total.return),
        },
        {
          name: m.grading_short_beta_label(),
          value: formatBeta(item.measures.beta),
        },
      ],
    });
  }
  return (
    <div className={styles["miniMap"]}>
      <RiskMap
        market={{
          key: marketIndex.code,
          name: marketIndex.code,
          across: marketBeta,
          up: marketReturn,
          values: [
            {
              name: m.grading_short_return_label(),
              value: formatSignedPercent(marketReturn),
            },
          ],
        }}
        points={points}
        across={{
          style: "decimal",
          toValue: beta,
          title: m.grading_short_beta_label(),
        }}
        up={{ style: "change", toValue: cumulativeReturn }}
        levelLabel=""
        compact
        short
        labelledBy={selectedStudentHeadingId}
      />
    </div>
  );
}
