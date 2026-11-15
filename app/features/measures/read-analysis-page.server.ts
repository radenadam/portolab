import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import { portfolioHome } from "~/features/trading/portfolio-home";
import type { PortfolioPageRequest } from "~/features/trading/find-trading-place.server";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readOwnedPortfolioReport } from "~/features/trading/read-owned-portfolio-report.server";
import { measuresPath } from "./measures-path";
import {
  readAnalysis,
  readAnalysisAxis,
  readAnalysisData,
} from "./read-analysis.server";

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
  const axis = readAnalysisAxis(url);
  if (!axis.ok) {
    return data(
      {
        kind: "axisFailure" as const,
        path: measuresPath(place.classId, kind),
        showTitle: kind === "membership",
        value: url.searchParams.get("axis") ?? "",
        failure: axis.failure,
      },
      { status: 400 },
    );
  }
  return {
    kind: "analysis" as const,
    classId: place.classId,
    report,
    ...readAnalysis(database, report),
    axis: axis.value,
    now,
    source,
    firstSessionDate: place.firstSessionDate,
    summary: { path: home.path, label: home.title },
    reader: {
      kind: "owner" as const,
      classId: place.classId,
      portfolioKind: kind,
    },
    showTitle: kind === "membership",
    showData: readAnalysisData(url),
  };
}
