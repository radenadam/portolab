import type { Database } from "~/database/database.server";
import { measureStoredMarket } from "~/features/measures/measure-stored.server";
import { summarizeMarket } from "~/features/measures/measure-summaries";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import {
  databaseWithClosesForTest,
  valuationForTest,
} from "~/features/measures/measures-for-test.server";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import { defaultLessonBeta } from "./lesson-beta-range";
import { practicePortfolio } from "./practice-portfolio";
import type { LessonPracticeData } from "./lesson-practice-data";

export function lessonPracticeForTest(
  valuation: PortfolioValuation = valuationForTest(["BBCA", "TLKM"]),
  database: Database = databaseWithClosesForTest(),
): LessonPracticeData {
  const report = readPortfolioMeasures(database, valuation);
  const own = practicePortfolio(report);
  const market = measureStoredMarket(database);
  return {
    report,
    initialBeta: defaultLessonBeta(own),
    market:
      own?.market ?? (market.ok ? summarizeMarket(market.value) : undefined),
    marketFailure: market.ok ? undefined : market.failure,
    simulation: own,
    holdings: own?.holdings ?? [],
  };
}
