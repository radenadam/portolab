import type { RouterContextProvider } from "react-router";
import { courseSessions } from "~/features/classes/course-calendar";
import { readAnonymousClassmates } from "~/features/grading/read-anonymous-classmates.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { parseHomeMapView } from "./parse-home-map-view";
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
import { readOwnedPortfolioReport } from "./read-owned-portfolio-report.server";
import { readPortfolioDayChange } from "./read-portfolio-day-change.server";

/** Class context is private, so owner authorization must precede both reads. */
export function readHomePortfolio(
  context: Readonly<RouterContextProvider>,
  input: {
    request: Request;
    url: URL;
    classId: string;
    now: Date;
    firstSessionDate: string | null;
  },
  kind: PortfolioOwner["kind"] = "membership",
) {
  const { place, portfolio, source, report } = readOwnedPortfolioReport(
    context,
    input,
    kind,
  );
  const database = context.get(databaseContext);
  const today = wibDateOf(input.now);
  const rules = idxRulesOn(today);
  const view = parseHomeMapView(input.url.searchParams.get("view"), "view");
  const measures = readPortfolioMeasures(database, report.valuation);
  return {
    view: view.ok ? view.value : ("map" as const),
    sessions: courseSessions(input.firstSessionDate),
    classmates: readAnonymousClassmates(database, {
      membershipId:
        place.owner.kind === "membership"
          ? place.owner.membershipId
          : undefined,
      startingCash: place.owner.startingCash,
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
