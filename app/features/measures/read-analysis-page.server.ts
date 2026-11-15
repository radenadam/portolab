import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import { portfolioHome } from "~/features/trading/portfolio-home";
import type { PortfolioPageRequest } from "~/features/trading/find-trading-place.server";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readOwnedPortfolioReport } from "~/features/trading/read-owned-portfolio-report.server";
import { m } from "~/paraglide/messages.js";
import { measureStoredMarket } from "./measure-stored.server";
import { summarizeMarket } from "./measure-summaries";
import { parseAnalysisAxis } from "./parse-analysis-axis";
import {
  readPortfolioMeasures,
  readStockRows,
  readStudentLine,
} from "./read-measures.server";

export function readAnalysisPage(
  { context, request, params, url, now }: PortfolioPageRequest,
  kind: PortfolioKind,
) {
  const database = context.get(databaseContext);
  const { place, report, source } = readOwnedPortfolioReport(
    context,
    {
      request,
      url,
      classId: params.classId,
      now,
    },
    kind,
  );
  const home = portfolioHome(place.classId, kind);
  const axisValue = url.searchParams.get("axis");
  const axis = parseAnalysisAxis(axisValue, m.measures_analysis_axis_label());
  if (!axis.ok) {
    return data(
      {
        kind: "axisFailure" as const,
        path: `${home.path}/analysis`,
        showTitle: kind === "membership",
        value: axisValue ?? "",
        failure: axis.failure,
      },
      { status: 400 },
    );
  }
  const measures = readPortfolioMeasures(database, report.valuation);
  const stocks = readStockRows(database);
  const market = measureStoredMarket(database);
  return {
    kind: "analysis" as const,
    classId: place.classId,
    report,
    measures,
    marketLine: readStudentLine(
      database,
      { valuation: report.valuation, report: measures },
      stocks,
    ),
    market: market.ok ? summarizeMarket(market.value) : undefined,
    stocks,
    axis: axis.value,
    now,
    source,
    firstSessionDate: place.firstSessionDate,
    portfolioHome: home,
    portfolioKind: kind,
    showTitle: kind === "membership",
  };
}
