import type { RouterContextProvider } from "react-router";
import { courseSessions } from "~/features/classes/course-calendar";
import { readAnonymousClassmates } from "~/features/grading/read-anonymous-classmates.server";
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
import type { Portfolio, PortfolioOwner } from "./portfolio-store.server";
import type { PortfolioReport } from "./read-portfolio-report.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import type { ClassId } from "~/features/classes/classes.schema";

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
  return readHomePortfolioData(context, {
    ...input,
    classId: place.classId,
    owner: place.owner,
    portfolio,
    source,
    report,
  });
}

/** The caller authorizes the owner before reading the portfolio or its class context. */
export function readHomePortfolioData(
  context: Readonly<RouterContextProvider>,
  input: {
    request: Request;
    url: URL;
    now: Date;
    firstSessionDate: string | null;
    classId: ClassId;
    owner: PortfolioOwner;
    portfolio: Portfolio;
    report: PortfolioReport;
    source: PriceSourceDescription;
  },
) {
  const { portfolio, source, report } = input;
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
        input.owner.kind === "membership"
          ? input.owner.membershipId
          : undefined,
      startingCash: input.owner.startingCash,
      classId: input.classId,
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
