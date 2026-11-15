import { classPath } from "~/features/classes/class-path";
import { homeTitle } from "~/features/trading/home-title";
import type { ReactNode } from "react";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readStudentPortfolioReport } from "~/features/trading/read-student-portfolio-report.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { parseOptionalText } from "~/form-text";
import type { Route } from "./+types/measures-page";
import { AnalysisView } from "./analysis-view";
import { AnalysisAxisForm } from "./analysis-axis-form";
import { readAnalysis, readAnalysisAxis } from "./read-analysis.server";
import { analysisDataReturn } from "./analysis-data-return";

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
  const axis = readAnalysisAxis(url);
  if (!axis.ok) {
    return data(
      {
        kind: "axisFailure" as const,
        value: axisValue ?? "",
        failure: axis.failure,
      },
      { status: 400 },
    );
  }
  // The hint restores a return address, so a forged hint must not block the normal page.
  const dataReturn = parseOptionalText(
    url.searchParams.get(analysisDataReturn.parameter),
    m.measures_analysis_data_label(),
  );
  return {
    kind: "analysis" as const,
    classId: place.classId,
    report,
    ...readAnalysis(database, report),
    axis: axis.value,
    now,
    source,
    firstSessionDate: place.firstSessionDate,
    showData: dataReturn.ok && dataReturn.value === analysisDataReturn.value,
  };
}

export default function MeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  if (loaderData.kind === "axisFailure") {
    return (
      <AnalysisAxisForm value={loaderData.value} failure={loaderData.failure} />
    );
  }
  return (
    <AnalysisView
      {...loaderData}
      reader={{ kind: "owner", classId: loaderData.classId }}
      summary={{ path: classPath(loaderData.classId), label: homeTitle() }}
    />
  );
}
