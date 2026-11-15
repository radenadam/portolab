import type { Database } from "~/database/database.server";
import { listStudents } from "~/features/classes/class-store.server";
import type { ClassId, MembershipId } from "~/features/classes/classes.schema";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { readCurrentPortfolio } from "~/features/trading/read-current-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import type { Beta } from "~/units/beta";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { Rupiah } from "~/units/rupiah";

/** Only coordinates cross the feature boundary, so a student's loader cannot expose classmates' identities. The caller first checks membership of this class. */
export function readAnonymousClassmates(
  database: Database,
  input: {
    classId: ClassId;
    membershipId: MembershipId | undefined;
    startingCash: Rupiah;
    request: Request;
    now: Date;
  },
): { beta: Beta; return: CumulativeReturn }[] {
  const points: { beta: Beta; return: CumulativeReturn }[] = [];
  for (const student of listStudents(database, input.classId)) {
    if (student.membershipId === input.membershipId) continue;
    const owner = {
      kind: "membership" as const,
      membershipId: student.membershipId,
      startingCash: input.startingCash,
    };
    const { valuation } = readPortfolioValuation(database, {
      portfolio: readCurrentPortfolio(database, owner, input),
      startingCash: input.startingCash,
    });
    const measured = readPortfolioMeasures(database, valuation);
    if (
      measured.kind === "measured" &&
      measured.measures.ok &&
      valuation.total !== undefined
    ) {
      points.push({
        beta: measured.measures.value.beta,
        return: valuation.total.return,
      });
    }
  }
  return points.toSorted(
    (first, second) => first.beta - second.beta || first.return - second.return,
  );
}
