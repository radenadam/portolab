import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import { portfolioHome } from "~/features/trading/portfolio-home";
import type { PortfolioPageRequest } from "~/features/trading/find-trading-place.server";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readOwnedPortfolioReport } from "~/features/trading/read-owned-portfolio-report.server";
import { m } from "~/paraglide/messages.js";
import { parseOptionalText } from "~/form-text";
import { analysisDataReturn } from "./analysis-data-return";
import { measuresPath } from "./measures-path";
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
        path: measuresPath(place.classId, kind),
        showTitle: kind === "membership",
        value: axisValue ?? "",
        failure: axis.failure,
      },
      { status: 400 },
    );
  }
  const measures = readPortfolioMeasures(database, report.valuation);
  const stocks = readStockRows(database);
  // The hint restores a return address, so a forged hint must not block the normal page.
  const dataReturn = parseOptionalText(
    url.searchParams.get(analysisDataReturn.parameter),
    m.measures_analysis_data_label(),
  );
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
    showData: dataReturn.ok && dataReturn.value === analysisDataReturn.value,
  };
}
