import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readPortfolioReport } from "./read-portfolio-report.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";

export function readStudentPortfolioReport(
  context: Readonly<RouterContextProvider>,
  input: { request: Request; url: URL; classId: string; now: Date },
) {
  const { place, portfolio, source } = readStudentPortfolio(context, input);
  const report = readPortfolioReport(
    context.get(databaseContext),
    {
      portfolio,
      startingCash: place.owner.startingCash,
      joinedAt: place.joinedAt,
    },
    { now: input.now, delayMinutes: source.delayMinutes },
  );
  return { place, portfolio, report, source };
}
