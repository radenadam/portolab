import { readLessonExample } from "./read-lesson-example.server";

import { practicePortfolio } from "./practice-portfolio";
import { defaultLessonBeta } from "./lesson-beta-range";
import type { LessonPracticeData } from "./lesson-practice-data";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { requireUser } from "~/features/accounts/current-session.server";
import { measureStoredMarket } from "~/features/measures/measure-stored.server";
import { summarizeMarket } from "~/features/measures/measure-summaries";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { readTradingPortfolio } from "~/features/trading/read-trading-portfolio.server";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";

import type { PortfolioMeasuresReport } from "~/features/measures/read-measures.server";

export function readLessonPractice(
  context: Readonly<RouterContextProvider>,
  input: { request: Request; url: URL; classId: string; now: Date },
): LessonPracticeData {
  const reader = requireUser(context, input.url);
  const database = context.get(databaseContext);
  let report: PortfolioMeasuresReport | undefined;
  if (reader.role === "student") {
    const { place, portfolio } = readTradingPortfolio(
      context,
      input,
      "membership",
    );
    const { valuation } = readPortfolioValuation(database, {
      portfolio,
      startingCash: place.owner.startingCash,
    });
    report = readPortfolioMeasures(database, valuation);
  }
  const portfolio = practicePortfolio(report);
  const market = measureStoredMarket(database);
  return {
    initialBeta: defaultLessonBeta(portfolio),
    report,
    holdings: portfolio?.holdings ?? [],
    market:
      portfolio?.market ??
      (market.ok ? summarizeMarket(market.value) : undefined),
    marketFailure: market.ok ? undefined : market.failure,
    simulation: portfolio ?? readLessonExample(database),
  };
}
