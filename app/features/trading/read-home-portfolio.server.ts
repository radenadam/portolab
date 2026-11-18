import { parseOnboardingStep } from "./parse-onboarding-step";
import type { RouterContextProvider } from "react-router";
import { readHomeWelcome } from "./read-home-welcome.server";
import { courseSessions } from "~/features/classes/course-calendar";
import { readHomeDismissedAt } from "~/features/classes/home-dismissal.server";
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
import { homeSinceOrders } from "./home-since-orders";
import type { Portfolio, PortfolioOwner } from "./portfolio-store.server";
import type { PortfolioReport } from "./read-portfolio-report.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import type { ClassId } from "~/features/classes/classes.schema";

/** Class context is private, so owner authorization must precede its reads. */
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
  const home = readHomePortfolioData(context, {
    ...input,
    classId: place.classId,
    owner: place.owner,
    portfolio,
    source,
    report,
  });
  const welcome =
    place.owner.kind === "membership"
      ? readHomeWelcome(context.get(databaseContext), {
          portfolio,
          startingCash: place.owner.startingCash,
          now: input.now,
        })
      : undefined;
  const onboarding = parseOnboardingStep(
    welcome === undefined ? null : input.url.searchParams.get("welcome"),
    "welcome",
  );
  return {
    ...home,
    welcome,
    onboarding: onboarding.ok ? onboarding.value : undefined,
    sinceOrders:
      place.owner.kind === "membership"
        ? homeSinceOrders(
            portfolio.orders,
            readHomeDismissedAt(
              context.get(databaseContext),
              place.owner.membershipId,
            ),
            input.now,
          )
        : [],
  };
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
    histories: report.valuation.holdings.map((holding) => ({
      code: holding.code,
      closes: homeSparklineCloses(
        listStockHistory(database, holding.code).closes,
        {
          now: input.now,
          delayMinutes: source.delayMinutes,
          quote: holding.kind === "priced" ? holding.quote : undefined,
        },
      ),
    })),
    delayMinutes: source.delayMinutes,
    now: input.now,
  };
}

export type HomePortfolioData = ReturnType<typeof readHomePortfolioData>;
