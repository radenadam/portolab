import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { Username } from "~/features/accounts/username";
import { listStudents } from "~/features/classes/class-store.server";
import type { TaughtClassDetails } from "~/features/classes/taught-class.server";
import { explainPortfolioMeasures } from "~/features/measures/explain-portfolio-measures";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { readCurrentPortfolio } from "~/features/trading/read-current-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import type { Beta } from "~/units/beta";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { Rupiah } from "~/units/rupiah";

/** The measures of a portfolio that the lecturer compares across the students of a class. */
export interface ComparedMeasures {
  /** How far the expected return lies above the security market line, which ranks the portfolios, as decision 0021 explains. */
  distance: MonthlyReturn;
  expectedReturn: MonthlyReturn;
  standardDeviation: MonthlyReturn;
  beta: Beta;
  requiredReturn: MonthlyReturn;
}

/** A student of a class with the value of the portfolio of the student at delayed prices and its return since the starting cash, or undefined while a holding has no delayed price. */
interface StudentValue {
  studentId: UserId;
  name: string;
  username: Username;
  total: { value: Rupiah; return: CumulativeReturn } | undefined;
}

/** A student whose portfolio has measures. */
export type RankedStudent = StudentValue & { measures: ComparedMeasures };

/** A student whose portfolio has no measures, with the text that tells the lecturer why and when it gets them. */
export type UnmeasuredStudent = StudentValue & { reason: string };

/** The portfolios of the students of a class as the lecturer compares them at a moment. */
export interface ClassPortfolios {
  /** The students whose portfolios have measures, from the highest distance from the security market line to the lowest. Students with the same distance keep the order in which they joined. */
  ranked: RankedStudent[];
  /** The students whose portfolios have no measures, in the order in which they joined. */
  unmeasured: UnmeasuredStudent[];
}

/** Values the portfolio of every student of a class at the latest delayed prices and measures it from the stored closes, as the lecturer compares them at a moment, after a check of the open orders of each, as a visit of the student would check them. The texts are in the language of the request. */
export function readClassPortfolios(
  database: Database,
  taughtClass: TaughtClassDetails,
  { request, now }: { request: Request; now: Date },
): ClassPortfolios {
  const ranked: RankedStudent[] = [];
  const unmeasured: UnmeasuredStudent[] = [];
  for (const student of listStudents(database, taughtClass.id)) {
    const owner = {
      membershipId: student.membershipId,
      startingCash: taughtClass.startingCash,
    };
    const valuation = readPortfolioValuation(database, {
      portfolio: readCurrentPortfolio(database, owner, { request, now }),
      startingCash: taughtClass.startingCash,
    });
    const { total } = valuation.valuation;
    const studentValue: StudentValue = {
      studentId: student.id,
      name: student.name,
      username: student.username,
      total:
        total === undefined
          ? undefined
          : { value: total.value, return: total.return },
    };
    const measures = explainPortfolioMeasures(
      readPortfolioMeasures(database, valuation.valuation),
      { kind: "lecturer", studentName: student.name },
    );
    if (measures.ok) {
      const summary = measures.value;
      ranked.push({
        ...studentValue,
        measures: {
          distance: summary.securityMarketLine.value,
          expectedReturn: summary.expectedReturn,
          standardDeviation: summary.standardDeviation,
          beta: summary.beta,
          requiredReturn: summary.requiredReturn.value,
        },
      });
    } else {
      unmeasured.push({ ...studentValue, reason: measures.failure });
    }
  }
  // listStudents gives the students in the order in which they joined, and a sort keeps the order of equal elements, so students with the same distance keep it.
  ranked.sort(
    (first, second) => second.measures.distance - first.measures.distance,
  );
  return { ranked, unmeasured };
}
