import type { ReactNode } from "react";
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
  return (
    <HomePortfolio
      home={loaderData.home}
      classId={loaderData.classId}
      showTitle={false}
      reader={{
        kind: "owner",
        classId: loaderData.classId,
        portfolioKind: "demonstration",
      }}
    />
  );
}
