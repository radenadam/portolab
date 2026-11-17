import { studentIdentifier } from "~/features/classes/student-identifier";
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
      {(textValue) =>
        rank === undefined
          ? m.grading_unranked_notice({
              identifier: textValue(studentIdentifier(student)),
            })
          : m.grading_rank_notice({
              identifier: textValue(studentIdentifier(student)),
              rank: formatNumber(rank.rank),
              total: formatNumber(rank.total),
            })
      }
    </NumberText>
  );
}
