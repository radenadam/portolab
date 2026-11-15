import type { ReactNode } from "react";
import { measuresPath } from "~/features/measures/measures-path";
import { demonstrationPath } from "./demonstration-path";
import { HomePortfolio } from "./home-portfolio";
import { readHomePortfolio } from "./read-home-portfolio.server";
import { findTradingPlace } from "./find-trading-place.server";
import type { Route } from "./+types/demonstration-summary-page";

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const place = findTradingPlace(context, url, {
    classId: params.classId,
    kind: "demonstration",
  });
  return {
    classId: place.classId,
    home: readHomePortfolio(
      context,
      {
        request,
        url,
        classId: params.classId,
        now,
        firstSessionDate: place.firstSessionDate,
      },
      "demonstration",
    ),
  };
}

export default function DemonstrationSummaryPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const path = demonstrationPath(loaderData.classId);
  return (
    <HomePortfolio
      home={loaderData.home}
      classId={loaderData.classId}
      path={path}
      analysisPath={measuresPath(loaderData.classId, "demonstration")}
      showTitle={false}
      portfolioKind="demonstration"
    />
  );
}
