import { data } from "react-router";
import { activityPath } from "./activity-path";
import { findTradingPlace } from "./find-trading-place.server";
import type { PortfolioPageRequest } from "./find-trading-place.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { cancelFromForm } from "./order-actions.server";
import { readTradingPortfolio } from "./read-trading-portfolio.server";
import { readActivity } from "./read-activity.server";
export function readActivityPage(
  { context, request, params, url, now }: PortfolioPageRequest,
  kind: PortfolioOwner["kind"],
) {
  const { place, portfolio } = readTradingPortfolio(
    context,
    {
      request,
      url,
      classId: params.classId,
      now,
    },
    kind,
  );
  const activity = readActivity(context, {
    url,
    portfolio,
    now,
    initialView: "orders",
  });
  return data(
    {
      ...activity,
      classId: place.classId,
      path: activityPath(place.classId, kind),
      demonstration: kind === "demonstration",
      portfolioKind: kind,
    },
    { status: activity.status },
  );
}

export async function cancelActivityOrder(
  { context, request, params, url, now }: PortfolioPageRequest,
  kind: PortfolioOwner["kind"],
) {
  const place = findTradingPlace(context, url, {
    classId: params.classId,
    kind: kind,
  });
  return cancelFromForm(
    context,
    { form: await request.formData(), place, now },
    `${activityPath(place.classId, kind)}${url.search}`,
  );
}
