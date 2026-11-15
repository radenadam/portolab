import { readActivity } from "./read-activity.server";
import { ActivityView } from "./activity-view";
import type { ReactNode } from "react";
import { data } from "react-router";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { parseRecordId } from "~/value-parsers";
import type { Route } from "./+types/activity-page";
import { activityPath } from "./activity-path";
import { findStudentPlace } from "./find-student-place.server";
import { cancelFromForm } from "./order-actions.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";
import type { OrderId } from "./trading.schema";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.trading_activity_title()) }];
}

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const { place, portfolio } = readStudentPortfolio(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
  const activity = readActivity(context, {
    url,
    portfolio,
    now,
    initialView: "orders",
  });
  const placed = parseRecordId<OrderId>(
    url.searchParams.get("placed"),
    "placed",
  );
  return data(
    {
      ...activity,
      classId: place.classId,
      // The notice confirms only an order of this portfolio, so an address cannot confirm another student's order.
      isPlaced:
        placed.ok &&
        portfolio.orders.some((order) => order.id === placed.value),
    },
    { status: activity.status },
  );
}

export const shouldRevalidate = reloadsAfterEveryForm;

export async function action({
  context,
  request,
  params,
  url,
}: Route.ActionArgs) {
  const now = new Date();
  const place = findStudentPlace(context, url, params.classId);
  return cancelFromForm(
    context,
    { form: await request.formData(), place, now },
    `${activityPath(place.classId)}${url.search}`,
  );
}

export default function ActivityPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId } = loaderData;
  const cancelFailure = actionData?.cancelFailure;
  const { filter, view } =
    cancelFailure === undefined
      ? loaderData
      : { filter: "all" as const, view: "orders" as const };
  return (
    <ActivityView
      {...loaderData}
      base={activityPath(classId)}
      filter={filter}
      view={view}
      cancelFailure={cancelFailure}
    />
  );
}
