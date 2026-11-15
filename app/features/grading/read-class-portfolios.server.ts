import { latestPortfolioActivity } from "~/features/trading/latest-portfolio-activity";
import type { Database } from "~/database/database.server";
import type { UserId } from "~/features/accounts/accounts.schema";
import type { Username } from "~/features/accounts/username";
import { listStudents } from "~/features/classes/class-store.server";
import type { TaughtClassDetails } from "~/features/classes/taught-class.server";
import { explainPortfolioMeasures } from "~/features/measures/explain-portfolio-measures";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import type { PortfolioMeasuresReport } from "~/features/measures/read-measures.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readCurrentPortfolio } from "~/features/trading/read-current-portfolio.server";
import { readPortfolioReport } from "~/features/trading/read-portfolio-report.server";
import type { ValuationReport } from "~/features/trading/read-portfolio-report.server";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { wibDateOf, wibMoment } from "~/wib";
import { startOfWeek } from "~/calendar-dates";
import { comparedMeasures } from "./compared-measures";
import type { ComparedMeasures } from "./compared-measures";
import type { Rupiah } from "~/units/rupiah";

/** A student of a class with the value of the portfolio of the student at delayed prices and its return since the starting cash, or undefined while a holding has no delayed price. */
interface StudentValue {
  studentId: UserId;
  name: string;
  username: Username;
  total: { value: Rupiah; return: CumulativeReturn } | undefined;
  joinOrder: number;
  lastActivity: Date | undefined;
  hasHoldings: boolean;
  activeThisWeek: boolean;
  marketReturn: CumulativeReturn | undefined;
}

/** A student whose portfolio has measures. */
export type RankedStudent = StudentValue & { measures: ComparedMeasures };

/** A student whose portfolio has no measures, with the text that tells the lecturer why and when it gets them. */
export type UnmeasuredStudent = StudentValue & {
  reason: string;
  report: PortfolioMeasuresReport;
};

/** The portfolios of the students of a class as the lecturer compares them at a moment. */
export interface ClassPortfolios {
  /** The students whose portfolios have course measures, in joining order. */
  ranked: RankedStudent[];
  /** The students whose portfolios have no measures, in the order in which they joined. */
  unmeasured: UnmeasuredStudent[];
  /** The sentences that name the delayed prices of the holdings of the class that the latest attempt of the quote job could not update, and when the job tries again, or undefined when it updated all of them. */
  quoteFailure: string | undefined;
}

/** Values the portfolio of every student of a class at the latest delayed prices and measures it from the stored closes, as the lecturer compares them at a moment, after a check of the open orders of each, as a visit of the student would check them. The texts are in the language of the request. */
export function readClassPortfolios(
  database: Database,
  taughtClass: TaughtClassDetails,
  {
    request,
    now,
    delayMinutes,
  }: {
    request: Request;
    now: Date;
    delayMinutes: number;
  },
): ClassPortfolios {
  const ranked: RankedStudent[] = [];
  const unmeasured: UnmeasuredStudent[] = [];
  const valuations: ValuationReport[] = [];
  const weekStart = wibMoment(startOfWeek(wibDateOf(now)), 0);
  for (const [joinOrder, student] of listStudents(
    database,
    taughtClass.id,
  ).entries()) {
    const owner = {
      membershipId: student.membershipId,
      startingCash: taughtClass.startingCash,
    };
    const portfolio = readCurrentPortfolio(database, owner, { request, now });
    const valuation = readPortfolioReport(
      database,
      {
        portfolio,
        startingCash: taughtClass.startingCash,
        joinedAt: student.joinedAt,
      },
      { now, delayMinutes },
    );
    valuations.push(valuation);
    const { total } = valuation.valuation;
    const studentValue: StudentValue = {
      studentId: student.id,
      name: student.name,
      username: student.username,
      joinOrder,
      marketReturn: valuation.market?.return,
      lastActivity: latestPortfolioActivity(portfolio),
      hasHoldings: portfolio.holdings.length > 0,
      activeThisWeek: portfolio.orders.some(
        (order) => order.placedAt >= weekStart,
      ),
      total:
        total === undefined
          ? undefined
          : { value: total.value, return: total.return },
    };
    const report = readPortfolioMeasures(database, valuation.valuation);
    const measures = explainPortfolioMeasures(report, {
      kind: "lecturer",
      studentName: student.name,
    });
    if (measures.ok) {
      const summary = measures.value;
      ranked.push({
        ...studentValue,
        measures: comparedMeasures(summary),
      });
    } else {
      unmeasured.push({ ...studentValue, reason: measures.failure, report });
    }
  }
  return {
    ranked,
    unmeasured,
    quoteFailure: holdingQuoteFailureText(valuations, { now, delayMinutes }),
  };
}
