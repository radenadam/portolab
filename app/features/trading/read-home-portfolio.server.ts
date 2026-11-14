import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { listStockHistory } from "~/features/market-data/history-store.server";
import { attemptForCodes } from "~/features/market-data/quote-failure-text";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import { wibDateOf } from "~/wib";
import { homeSparklineCloses } from "./home-sparkline-closes";
import { cashSetAside } from "./open-orders";
import { idxRulesOn } from "./idx-rules-on";
import { readPortfolioReport } from "./read-portfolio-report.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { readPortfolioDayChange } from "./read-portfolio-day-change.server";

/** Reads only the signed-in student's portfolio, after checking orders at this request's moment. */
export function readHomePortfolio(
  context: Readonly<RouterContextProvider>,
  input: {
    request: Request;
    url: URL;
    classId: string;
    now: Date;
  },
) {
  const { place, portfolio, source } = readStudentPortfolio(context, input);
  const database = context.get(databaseContext);
  const fullReport = readPortfolioReport(
    database,
    {
      portfolio,
      startingCash: place.owner.startingCash,
      joinedAt: place.joinedAt,
    },
    { now: input.now, delayMinutes: source.delayMinutes },
  );
  const report = {
    valuation: fullReport.valuation,
    history: fullReport.history,
    quoteAttempt: attemptForCodes(
      fullReport.quoteAttempt,
      portfolio.holdings.map(({ code }) => code),
    ),
  };
  const today = wibDateOf(input.now);
  const rules = idxRulesOn(today);
  return {
    report,
    measures: readPortfolioMeasures(database, report.valuation),
    dayChange: readPortfolioDayChange(database, {
      portfolio,
      valuation: report.valuation,
      now: input.now,
      delayMinutes: source.delayMinutes,
    }),
    setAside: cashSetAside(portfolio.orders, input.now),
    lotShares: rules.ok ? rules.value.lotShares : undefined,
    histories: portfolio.holdings.map(({ code }) => ({
      code,
      closes: homeSparklineCloses(listStockHistory(database, code).closes, {
        now: input.now,
        delayMinutes: source.delayMinutes,
      }),
    })),
    delayMinutes: source.delayMinutes,
    now: input.now,
  };
}

export type HomePortfolioData = ReturnType<typeof readHomePortfolio>;
