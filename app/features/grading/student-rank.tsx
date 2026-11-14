import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { studentRank } from "./ranking-measure";
import type { RankingMeasure } from "./ranking-measure";
import type { ComparedStudent } from "./student-filters";

export function StudentRank({
  student,
  all,
  measure,
}: {
  student: ComparedStudent;
  all: readonly ComparedStudent[];
  measure: RankingMeasure;
}): ReactNode {
  const rank = studentRank(student, all, measure);
  return (
    <NumberText>
      {rank === undefined
        ? m.grading_unranked_notice({ username: student.username })
        : m.grading_rank_notice({
            username: student.username,
            rank: formatNumber(rank.rank),
            total: formatNumber(rank.total),
          })}
    </NumberText>
  );
}
