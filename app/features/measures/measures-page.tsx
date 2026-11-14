import type { ReactNode } from "react";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readStudentPortfolioReport } from "~/features/trading/read-student-portfolio-report.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/measures-page";
import { AnalysisView } from "./analysis-view";
import { AnalysisAxisForm } from "./analysis-axis-form";
import { measureStoredMarket } from "./measure-stored.server";
import { summarizeMarket } from "./measure-summaries";
import { parseAnalysisAxis } from "./parse-analysis-axis";
import {
  readPortfolioMeasures,
  readStockRows,
  readStudentLine,
} from "./read-measures.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.measures_analysis_title()) }];
}

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const database = context.get(databaseContext);
  const { place, report, source } = readStudentPortfolioReport(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
  const axisValue = url.searchParams.get("axis");
  const axis = parseAnalysisAxis(axisValue, m.measures_analysis_axis_label());
  if (!axis.ok) {
    return data(
      {
        kind: "axisFailure" as const,
        classId: place.classId,
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
  };
}

export default function MeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  if (loaderData.kind === "axisFailure") {
    return <AnalysisAxisForm {...loaderData} />;
  }
  return <AnalysisView {...loaderData} />;
}
