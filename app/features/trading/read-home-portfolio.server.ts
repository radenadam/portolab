import type { RouterContextProvider } from "react-router";
import { courseSessions } from "~/features/classes/course-calendar";
import { readAnonymousClassmates } from "~/features/grading/read-anonymous-classmates.server";
import { parseHomeMapView } from "./parse-home-map-view";
import { readInsightLessons } from "~/features/learning/read-insight-lessons.server";
import { databaseContext } from "~/database/database.server";
import { listStockHistory } from "~/features/market-data/history-store.server";
import {
  readPortfolioMeasures,
  readStockMeasures,
} from "~/features/measures/read-measures.server";
import { wibDateOf } from "~/wib";
import { homeSparklineCloses } from "./home-sparkline-closes";
import { cashSetAside } from "./open-orders";
import { idxRulesOn } from "./idx-rules-on";
import { readPortfolioReport } from "./read-portfolio-report.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { readPortfolioDayChange } from "./read-portfolio-day-change.server";

/** Membership is checked before reading either the student's portfolio or the anonymous class context. */
export function readHomePortfolio(
  context: Readonly<RouterContextProvider>,
  input: {
    request: Request;
    url: URL;
    classId: string;
    now: Date;
    firstSessionDate: string | null;
  },
) {
  const { place, portfolio, source } = readStudentPortfolio(context, input);
  const database = context.get(databaseContext);
  const report = readPortfolioReport(
    database,
    {
      portfolio,
      startingCash: place.owner.startingCash,
      joinedAt: place.joinedAt,
    },
    { now: input.now, delayMinutes: source.delayMinutes },
  );
  const today = wibDateOf(input.now);
  const rules = idxRulesOn(today);
  const view = parseHomeMapView(input.url.searchParams.get("view"), "view");
  const measures = readPortfolioMeasures(database, report.valuation);
  return {
    lessons: readInsightLessons(),
    view: view.ok ? view.value : ("map" as const),
    sessions: courseSessions(input.firstSessionDate),
    classmates: readAnonymousClassmates(database, {
      ...place.owner,
      classId: place.classId,
      request: input.request,
      now: input.now,
    }),
    stockBetas:
      measures.kind === "measured" && measures.measures.ok
        ? []
        : portfolio.holdings.flatMap(({ code }) => {
            const stock = readStockMeasures(database, code);
            return stock.ok ? [{ code, beta: stock.value.beta.value }] : [];
          }),
    report,
    measures,
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
